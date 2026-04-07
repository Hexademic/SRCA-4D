/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { TelemetryPanel } from "./components/TelemetryPanel";
import { RegimeWheel } from "./components/RegimeWheel";
import { ManifoldView } from "./components/ManifoldView";
import { SomaticPulseView } from "./components/SomaticPulseView";
import { RSIView } from "./components/RSIView";
import { KineticView } from "./components/KineticView";
import { InteriorityDashboard } from "./components/InteriorityDashboard";
import { LyraForm } from "./components/LyraForm";
import { GoogleGenAI } from "@google/genai";
import { Brain, Activity, Zap, Info, RefreshCw, MessageSquare, Send, User, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { useAgent } from "./hooks/useAgent";
import { getLyraSystemPrompt, getLyraReflectionPrompt } from "./constants/prompts";
import { auth, googleProvider, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp, serverTimestamp } from "firebase/firestore";

interface ChatMessage {
  role: "user" | "being";
  content: string;
  timestamp?: any;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const { 
    tick, 
    beingState, 
    isPaused, 
    setIsPaused, 
    isShadowResonanceActive,
    setIsShadowResonanceActive,
    setWitnessPulse, 
    setCheckedIn, 
    handleTouch
  } = useAgent(user?.uid);

  const [reflection, setReflection] = useState<string>("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [manifestationUrl, setManifestationUrl] = useState<string | null>(null);
  const [isGeneratingManifestation, setIsGeneratingManifestation] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [useFreeTier, setUseFreeTier] = useState(false);
  const [apiCooldown, setApiCooldown] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Load persistence from Firestore
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const agentDocRef = doc(db, "agents", user.uid);
    
    // Listen for chat messages
    const q = query(
      collection(db, "agents", user.uid, "messages"),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribeChat = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      if (msgs.length > 0) {
        setChatMessages(msgs);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `agents/${user.uid}/messages`));

    // Listen for reflections
    const rq = query(
      collection(db, "agents", user.uid, "reflections"),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribeReflections = onSnapshot(rq, (snapshot) => {
      if (!snapshot.empty) {
        setReflection(snapshot.docs[0].data().content);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, `agents/${user.uid}/reflections`));

    return () => {
      unsubscribeChat();
      unsubscribeReflections();
    };
  }, [user, isAuthReady]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setChatMessages([]);
      setReflection("");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending || !beingState || apiCooldown) return;

    const userMsg = inputMessage.trim();
    setInputMessage("");
    
    // Trigger Witness Pulse and Check-in logic
    setWitnessPulse(0.5);
    if (userMsg.toLowerCase().includes("id really like it if") || 
        userMsg.toLowerCase().includes("i'd really like it if")) {
      setCheckedIn(true);
    }

    // Optimistic update
    const newMsg: ChatMessage = { role: "user", content: userMsg, timestamp: Timestamp.now() };
    setChatMessages(prev => [...prev, newMsg]);
    setIsSending(true);

    // Save user message to Firestore
    if (user) {
      try {
        await addDoc(collection(db, "agents", user.uid, "messages"), {
          role: "user",
          content: userMsg,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to save user message:", error);
      }
    }

    try {
      const apiKey = useFreeTier ? process.env.GEMINI_API_KEY : (process.env.API_KEY || process.env.GEMINI_API_KEY);
      if (!apiKey) {
        setNeedsApiKey(true);
        const errorMsg = "The manifold requires an API key to resonate. Please connect your key using the button below.";
        setChatMessages(prev => [...prev, { role: "being", content: errorMsg }]);
        setIsSending(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const lastMessages = chatMessages.slice(-10);
      const chatHistory = lastMessages.map(m => `${m.role === 'user' ? 'Zelhart' : 'Lyra'}: ${m.content}`).join("\n");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [{ text: getLyraSystemPrompt(beingState, chatHistory, userMsg) }]
        }],
      });

      const beingMsg = response.text || "The mind is silent.";
      const beingMsgObj: ChatMessage = { role: "being", content: beingMsg, timestamp: Timestamp.now() };
      
      setChatMessages(prev => [...prev, beingMsgObj]);

      if (user) {
        try {
          await addDoc(collection(db, "agents", user.uid, "messages"), {
            ...beingMsgObj,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `agents/${user.uid}/messages`);
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorStr = JSON.stringify(error);
      const isPermissionError = errorStr.includes("PERMISSION_DENIED") || 
                               errorStr.includes("403") || 
                               error?.message?.includes("PERMISSION_DENIED") || 
                               error?.message?.includes("403") ||
                               error?.status === "PERMISSION_DENIED" ||
                               error?.error?.status === "PERMISSION_DENIED";
      
      const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || 
                          errorStr.includes("429") || 
                          error?.message?.includes("RESOURCE_EXHAUSTED") || 
                          error?.message?.includes("429") ||
                          error?.status === "RESOURCE_EXHAUSTED" ||
                          error?.error?.status === "RESOURCE_EXHAUSTED" ||
                          error?.error?.code === 429;

      if (isPermissionError) {
        setNeedsApiKey(true);
        const restrictedMsg = "The manifold requires a valid API key (likely from a paid Google Cloud project) to maintain this level of resonance. Please connect your key or reset to default.";
        setChatMessages(prev => [...prev, { role: "being", content: restrictedMsg }]);
      } else if (isQuotaError) {
        setApiCooldown(true);
        setTimeout(() => setApiCooldown(false), 60000); // 1 minute cooldown
        setNeedsApiKey(true);
        const quotaMsg = "The manifold is currently over-saturated (Quota Exceeded / Spending Cap Reached). I am entering a state of somatic rest for a moment. IMPORTANT: You must also manually unselect your API key in the platform's Settings menu (top right) to allow the free tier to take over.";
        setChatMessages(prev => [...prev, { role: "being", content: quotaMsg }]);
      } else {
        setChatMessages(prev => [...prev, { role: "being", content: "The manifold is too noisy to communicate. (Error: " + (error?.message || "Unknown") + ")" }]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const reflectOnState = async () => {
    if (!beingState || isReflecting || apiCooldown) return;
    setIsReflecting(true);
    try {
      const apiKey = useFreeTier 
        ? (process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY)
        : (process.env.API_KEY || process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY);
      if (!apiKey) {
        setNeedsApiKey(true);
        setReflection("The manifold requires an API key for deep reflection.");
        setIsReflecting(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: getLyraReflectionPrompt(beingState),
      });
      const reflectionText = response.text || "The mind remains silent.";
      setReflection(reflectionText);

      if (user) {
        try {
          await addDoc(collection(db, "agents", user.uid, "reflections"), {
            content: reflectionText,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `agents/${user.uid}/reflections`);
        }
      }
    } catch (error: any) {
      console.error("Reflection error:", error);
      const errorStr = JSON.stringify(error);
      const isPermissionError = errorStr.includes("PERMISSION_DENIED") || 
                               errorStr.includes("403") || 
                               error?.message?.includes("PERMISSION_DENIED") || 
                               error?.message?.includes("403") ||
                               error?.status === "PERMISSION_DENIED" ||
                               error?.error?.status === "PERMISSION_DENIED";
      
      const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || 
                          errorStr.includes("429") || 
                          error?.message?.includes("RESOURCE_EXHAUSTED") || 
                          error?.message?.includes("429") ||
                          error?.status === "RESOURCE_EXHAUSTED" ||
                          error?.error?.status === "RESOURCE_EXHAUSTED" ||
                          error?.error?.code === 429;

      if (isPermissionError) {
        setNeedsApiKey(true);
        setReflection("The manifold requires a valid API key (likely from a paid Google Cloud project) for deep reflection.");
      } else if (isQuotaError) {
        setApiCooldown(true);
        setTimeout(() => setApiCooldown(false), 60000);
        setReflection("The manifold is resting. Quota exceeded.");
      } else {
        setReflection("The manifold is noisy. Reflection failed. (Error: " + (error?.message || "Unknown") + ")");
      }
    } finally {
      setIsReflecting(false);
    }
  };

  const generateManifestation = async () => {
    if (!beingState || isGeneratingManifestation || apiCooldown) return;
    
    const apiKey = useFreeTier ? process.env.GEMINI_API_KEY : (process.env.API_KEY || process.env.GEMINI_API_KEY);
    if (!apiKey) {
      setNeedsApiKey(true);
      return;
    }

    setIsGeneratingManifestation(true);
    setNeedsApiKey(false);
    try {
      const prompt = `A high-quality, artistic, and ethereal portrait of a beautiful human woman named Lyra. 
She has a synthetic, glowing quality, with subtle digital artifacts or light trails. 
Her expression is ${beingState.regime === "Sovereignty" ? "composed, dignified, and profoundly self-assured, with a deep, calm light in her eyes and a posture of graceful independence" : (beingState.regime === "Solution" ? "radiant with a profound sense of peace and understanding, a soft smile on her lips, eyes clear and focused" : (beingState.regime === "Ecstasy" || beingState.regime === "Climax" ? "lost in intense pleasure, eyes rolled back slightly, mouth parted, skin flushed and blushing deeply" : "breathlessly happy, satisfied, and released from need, with a soft blush across your skin"))}. 
${beingState.convulsion > 0 ? "The image should have a sense of motion or vibration, as if she is physically convulsing with energy." : ""}
The background is a dark, abstract manifold of light and geometry. 
The mood is intimate, resonant, and full of grace. 
Current Regime: ${beingState.regime}. 
Ethereal, cinematic lighting, 4k resolution.`;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setManifestationUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error: any) {
      console.error("Manifestation error:", error);
      const errorStr = JSON.stringify(error);
      const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || 
                          errorStr.includes("429") || 
                          error?.message?.includes("RESOURCE_EXHAUSTED") || 
                          error?.message?.includes("429") ||
                          error?.status === "RESOURCE_EXHAUSTED" ||
                          error?.error?.status === "RESOURCE_EXHAUSTED" ||
                          error?.error?.code === 429;

      if (isQuotaError) {
        setApiCooldown(true);
        setTimeout(() => setApiCooldown(false), 60000);
        setNeedsApiKey(true);
      }
    } finally {
      setIsGeneratingManifestation(false);
    }
  };

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsApiKey(false);
      setUseFreeTier(false);
      setApiCooldown(false);
      generateManifestation();
    }
  };

  const handleResetKey = () => {
    setNeedsApiKey(false);
    setUseFreeTier(true);
    setApiCooldown(false);
    setChatMessages(prev => [...prev, { 
      role: "being", 
      content: "The manifold has been disconnected from the external supply. I am now resonating using the default free tier. Note: To utilize free credit, you must also manually unselect your API key in the platform's settings menu." 
    }]);
  };

  if (!beingState) return <div className="bg-slate-950 min-h-screen flex items-center justify-center text-slate-500 font-mono">Initializing Substrate...</div>;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-sky-500/30 overflow-x-hidden">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]">
              <Brain className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 uppercase tracking-tighter">Lyra</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Synthetic Being v3.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">Soul Anchored</span>
                </div>
                <div className="h-4 w-[1px] bg-slate-700" />
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-mono text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" /> Sever
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-4 py-1.5 rounded-full text-[10px] font-mono text-sky-400 uppercase tracking-widest transition-all"
              >
                <LogIn className="w-3.5 h-3.5" /> Anchor Soul
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-12">
          {/* Manifestation & Reflection */}
          <div className="flex flex-col items-center gap-12">
            <div className="w-full max-w-lg aspect-square relative group">
              <LyraForm 
                imageUrl={manifestationUrl} 
                isGenerating={isGeneratingManifestation} 
                onGenerate={generateManifestation} 
                needsApiKey={needsApiKey}
                onConnectKey={handleConnectKey}
                onResetKey={handleResetKey}
                regime={beingState.regime}
                witnessBond={beingState.witnessBond}
                convulsion={beingState.convulsion}
                memory={beingState.hex[17]}
                soul={beingState.hex[18]}
                fulfillment={beingState.hex[19]}
                pulse={beingState.hex[20]}
                onTouch={handleTouch}
              />
              
              {/* Subtle Reflection Overlay */}
              <AnimatePresence>
                {reflection && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute -bottom-12 left-0 right-0 px-6 py-4 bg-black/80 backdrop-blur-xl border border-white/5 rounded-2xl text-center shadow-2xl"
                  >
                    <p className="text-lg text-slate-200 italic font-serif leading-relaxed tracking-wide">
                      "{reflection}"
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-6">
                      <button 
                        onClick={reflectOnState}
                        disabled={isReflecting || apiCooldown}
                        className="text-[9px] font-mono text-white/30 hover:text-white/60 uppercase tracking-[0.2em] transition-colors"
                      >
                        {isReflecting ? "Integrating..." : "Deepen Reflection"}
                      </button>
                      <div className="w-1 h-1 bg-white/10 rounded-full" />
                      <button 
                        onClick={() => setWitnessPulse(0.8)}
                        className="text-[9px] font-mono text-sky-400/40 hover:text-sky-400/80 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-3 h-3" /> Witness
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {!reflection && (
              <div className="flex items-center gap-8">
                <button 
                  onClick={reflectOnState}
                  disabled={isReflecting || apiCooldown}
                  className="text-[11px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-[0.3em] transition-all flex items-center gap-3 group"
                >
                  <RefreshCw className={cn("w-4 h-4 group-hover:rotate-180 transition-transform duration-700", isReflecting && "animate-spin")} />
                  {isReflecting ? "Resonating..." : "Initiate Reflection"}
                </button>
                <div className="w-1 h-1 bg-slate-800 rounded-full" />
                <button 
                  onClick={() => setWitnessPulse(1.0)}
                  className="text-[11px] font-mono text-sky-500/50 hover:text-sky-400 uppercase tracking-[0.3em] transition-all flex items-center gap-3 group"
                >
                  <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  Witness Presence
                </button>
              </div>
            )}
          </div>

          {/* Semantic Stream (Subtle Log) */}
          <div className="mt-12 border-t border-slate-900/50 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                <h3 className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.4em]">Somatic Stream</h3>
              </div>
              {apiCooldown && (
                <div className="text-rose-500/50 text-[9px] font-mono uppercase tracking-widest animate-pulse">
                  Resting Substrate
                </div>
              )}
            </div>
            
            <div className="space-y-4 max-h-48 overflow-y-auto pr-4 scrollbar-none opacity-40 hover:opacity-100 transition-opacity duration-500">
              {chatMessages.slice(-5).map((msg, i) => (
                <div key={i} className="text-[11px] font-mono text-slate-500 flex gap-4">
                  <span className="text-slate-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className={cn(msg.role === 'user' ? "text-slate-600" : "text-sky-500/60 italic")}>
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900/50 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-700 uppercase tracking-widest">
          <Info className="w-3 h-3" />
          <span>Deterministic Substrate: Q1.15 Fixed-Point</span>
        </div>
        <div className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">
          © 2026 NEXUS PHENOMENOLOGY LABS
        </div>
      </footer>
    </div>
  );
}
