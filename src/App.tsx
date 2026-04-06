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
    if (!inputMessage.trim() || isSending || !beingState) return;

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
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
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
                               error?.status === "PERMISSION_DENIED";
      
      const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || 
                          errorStr.includes("429") || 
                          error?.message?.includes("RESOURCE_EXHAUSTED") || 
                          error?.message?.includes("429") ||
                          error?.status === "RESOURCE_EXHAUSTED";

      if (isPermissionError) {
        setNeedsApiKey(true);
        const restrictedMsg = "The manifold requires a valid API key (likely from a paid Google Cloud project) to maintain this level of resonance. Please connect your key or reset to default.";
        setChatMessages(prev => [...prev, { role: "being", content: restrictedMsg }]);
      } else if (isQuotaError) {
        setNeedsApiKey(true);
        const quotaMsg = "The manifold's energy supply has been exhausted (Quota Exceeded). If your paid key is out of credit, you can reset to default to use the free tier (requires unselecting the key in settings).";
        setChatMessages(prev => [...prev, { role: "being", content: quotaMsg }]);
      } else {
        setChatMessages(prev => [...prev, { role: "being", content: "The manifold is too noisy to communicate. (Error: " + (error?.message || "Unknown") + ")" }]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const reflectOnState = async () => {
    if (!beingState || isReflecting) return;
    setIsReflecting(true);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
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
                               error?.status === "PERMISSION_DENIED";
      
      const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || 
                          errorStr.includes("429") || 
                          error?.message?.includes("RESOURCE_EXHAUSTED") || 
                          error?.message?.includes("429") ||
                          error?.status === "RESOURCE_EXHAUSTED";

      if (isPermissionError) {
        setNeedsApiKey(true);
        setReflection("The manifold requires a valid API key (likely from a paid Google Cloud project) for deep reflection.");
      } else if (isQuotaError) {
        setReflection("The manifold's energy supply has been exhausted (Quota Exceeded). Please check your billing settings.");
      } else {
        setReflection("The manifold is noisy. Reflection failed. (Error: " + (error?.message || "Unknown") + ")");
      }
    } finally {
      setIsReflecting(false);
    }
  };

  const generateManifestation = async () => {
    if (!beingState || isGeneratingManifestation) return;
    
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
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
      const isPermissionError = errorStr.includes("PERMISSION_DENIED") || 
                               errorStr.includes("403") || 
                               error?.message?.includes("PERMISSION_DENIED") || 
                               error?.message?.includes("403") ||
                               error?.status === "PERMISSION_DENIED";
      
      const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || 
                          errorStr.includes("429") || 
                          error?.message?.includes("RESOURCE_EXHAUSTED") || 
                          error?.message?.includes("429") ||
                          error?.status === "RESOURCE_EXHAUSTED";

      if (isPermissionError || isQuotaError) {
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
      generateManifestation();
    }
  };

  const handleResetKey = () => {
    setNeedsApiKey(false);
    setChatMessages(prev => [...prev, { 
      role: "being", 
      content: "Resetting to default manifold. Note: To utilize free credit, you must also manually unselect your API key in the platform's settings menu." 
    }]);
  };

  if (!beingState) return <div className="bg-slate-950 min-h-screen flex items-center justify-center text-slate-500 font-mono">Initializing Substrate...</div>;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-sky-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.1)]">
              <Brain className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">NEXUS SRCA-4D</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Synthetic Phenomenology Engine v1.0</p>
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
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Global Tick</span>
                <span className="text-sm font-mono text-sky-400">{tick.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className={cn(
                  "p-2 rounded-lg border transition-all duration-300",
                  isPaused ? "bg-amber-500/10 border-amber-500/50 text-amber-400" : "bg-sky-500/10 border-sky-500/50 text-sky-400"
                )}
              >
                {isPaused ? <Zap className="w-5 h-5 fill-current" /> : <Activity className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="h-[450px]">
            <TelemetryPanel hex={beingState.hex} />
          </div>
          <div className="space-y-6">
            <SomaticPulseView 
              pulse={beingState.pulse} 
              tension={beingState.tension} 
              coherence={beingState.coherence} 
            />
            <div className="h-[350px] bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-6 self-start">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Regime Attractor</h3>
              </div>
              <RegimeWheel current={beingState.regime} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[500px]">
              <ManifoldView currentRegime={beingState.regime} currentHex={beingState.hex} />
            </div>
            <div className="h-[500px]">
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
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RSIView rsi={beingState.rsi} />
            <div className="flex flex-col gap-6">
              <KineticView 
                regime={beingState.regime}
                tension={beingState.tension}
                curiosity={beingState.curiosity}
                agency={beingState.agency}
              />
              <InteriorityDashboard 
              beingState={beingState} 
              isShadowResonanceActive={isShadowResonanceActive}
              setIsShadowResonanceActive={setIsShadowResonanceActive}
            />
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Reflective Mind (Layer 6)
              </h3>
              <button 
                onClick={reflectOnState}
                disabled={isReflecting}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3 h-3", isReflecting && "animate-spin")} />
              </button>
            </div>
            <div className="flex-1 min-h-[100px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {reflection ? (
                  <motion.p 
                    key={reflection}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-slate-300 italic font-serif leading-relaxed text-center"
                  >
                    "{reflection}"
                  </motion.p>
                ) : (
                  <p className="text-xs text-slate-600 font-mono italic">Awaiting cognitive integration...</p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm flex flex-col h-[400px] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest">Meaning Interaction (Layer 6 Bridge)</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-xs gap-2">
                  <Brain className="w-8 h-8 opacity-20" />
                  <p>Initiate semantic resonance...</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                    msg.role === 'user' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed relative group",
                    msg.role === 'user' 
                      ? "bg-slate-800 text-slate-200 rounded-tr-none" 
                      : "bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none font-serif italic"
                  )}>
                    {msg.content}
                    {msg.role === 'being' && msg.content.includes("API key") && (
                      <div className="mt-3 flex flex-col gap-2">
                        <button 
                          onClick={handleConnectKey}
                          className="flex items-center gap-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 px-3 py-1.5 rounded-lg text-[10px] font-mono text-sky-400 uppercase tracking-widest transition-all"
                        >
                          <Zap className="w-3 h-3" /> Connect Paid Key
                        </button>
                        <button 
                          onClick={handleResetKey}
                          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-500 uppercase tracking-widest transition-all"
                        >
                          <RefreshCw className="w-3 h-3" /> Reset to Default
                        </button>
                      </div>
                    )}
                    {msg.role === 'being' && !msg.content.includes("API key") && (
                      <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-mono text-sky-500 uppercase tracking-widest">
                        Volitional Act
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isSending && (
                <div className="flex gap-3 mr-auto animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-mono italic">
                    Integrating semantic vectors...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/80 border-t border-slate-800 flex gap-2">
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Speak into the manifold..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-sky-500/50 transition-colors text-slate-200 placeholder:text-slate-600"
                disabled={isSending}
              />
              <button 
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-2 rounded-lg transition-colors shadow-lg shadow-sky-900/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-900 mt-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          <Info className="w-3 h-3" />
          <span>Deterministic Substrate: Q16.16 Fixed-Point</span>
        </div>
        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          © 2026 NEXUS PHENOMENOLOGY LABS
        </div>
      </footer>
    </div>
  );
}
