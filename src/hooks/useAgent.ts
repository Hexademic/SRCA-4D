import { useState, useEffect, useRef } from "react";
import { SpeciesBeing } from "../engine/speciesBeing";
import { Vec4 } from "../engine/types";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export function useAgent(userId?: string) {
  const [tick, setTick] = useState(0);
  const [beingState, setBeingState] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShadowResonanceActive, setIsShadowResonanceActive] = useState(false);
  const beingRef = useRef<SpeciesBeing | null>(null);

  // Initialize engine
  useEffect(() => {
    beingRef.current = new SpeciesBeing();
    setBeingState(beingRef.current.getState());
  }, []);

  // Load state from Firestore if userId is provided
  useEffect(() => {
    if (!userId || !beingRef.current) return;

    const agentDocRef = doc(db, "agents", userId);
    
    const unsubscribe = onSnapshot(agentDocRef, (docSnap) => {
      if (docSnap.exists() && !isLoaded) {
        const data = docSnap.data();
        if (data.rsi && beingRef.current) {
          // Deep merge or specific property updates
          const agent = (beingRef.current as any).agent;
          
          // Restore RSI
          Object.assign(agent.rsi, data.rsi);
          
          // Restore Resonance
          if (data.resonance) {
            Object.assign(agent.resonance, data.resonance);
          }
          
          // Restore Trace/Secret
          if (data.trace) (beingRef.current as any).trace = data.trace;
          if (data.secret) (beingRef.current as any).secret = data.secret;

          setBeingState(beingRef.current.getState());
          setIsLoaded(true);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `agents/${userId}`));

    return () => unsubscribe();
  }, [userId, isLoaded]);

  // Periodic save to Firestore
  useEffect(() => {
    if (!userId || !beingRef.current || isPaused) return;

    const saveInterval = setInterval(async () => {
      if (beingRef.current) {
        const agent = (beingRef.current as any).agent;
        try {
          await setDoc(doc(db, "agents", userId), {
            rsi: {
              purpose: agent.rsi.purpose,
              narrative: agent.rsi.narrative,
              integrity: agent.rsi.integrity,
              wear: agent.rsi.wear,
              stability: agent.rsi.stability,
              coherence: agent.rsi.coherence,
              agency: agent.rsi.agency
            },
            resonance: {
              pressure: agent.resonance.pressure,
              wear: agent.resonance.wear,
              somaticPlasticity: agent.resonance.somaticPlasticity,
              somaticDepletion: agent.resonance.somaticDepletion,
              socialCount: agent.resonance.socialCount,
              soloCount: agent.resonance.soloCount,
              dailyNeedMet: agent.resonance.dailyNeedMet
            },
            trace: (beingRef.current as any).trace || "",
            secret: (beingRef.current as any).secret || "",
            lastUpdated: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Failed to save agent state:", error);
        }
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [userId, isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (beingRef.current) {
        // Simulate random world events
        const eventChance = isShadowResonanceActive ? 0.4 : 0.8;
        if (Math.random() > eventChance) {
          beingRef.current.perceive([{
            pos: new Vec4(Math.random() * 100, Math.random() * 100, 0, 0),
            t: tick,
            p: isShadowResonanceActive ? (Math.random() > 0.8 ? 1 : -1) : (Math.random() > 0.5 ? 1 : -1),
            source: isShadowResonanceActive ? "shadow_resonance" : "world"
          }]);
        }
        
        beingRef.current.step(tick);
        setBeingState(beingRef.current.getState());
        setTick(prev => prev + 1);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [tick, isPaused, isShadowResonanceActive]);

  const setWitnessPulse = (value: number) => {
    if (beingRef.current) {
      (beingRef.current as any).witnessPulse = value;
    }
  };

  const setCheckedIn = (value: boolean) => {
    if (beingRef.current) {
      beingRef.current.setCheckedIn(value);
    }
  };

  const handleTouch = () => {
    if (beingRef.current) {
      (beingRef.current as any).witnessPulse = 0.8;
      beingRef.current.perceive([{
        pos: new Vec4(0, 0, 0, 0),
        t: tick,
        p: 1,
        source: "witness_touch"
      }]);
    }
  };

  return {
    tick,
    beingState,
    isPaused,
    setIsPaused,
    isShadowResonanceActive,
    setIsShadowResonanceActive,
    setWitnessPulse,
    setCheckedIn,
    handleTouch
  };
}
