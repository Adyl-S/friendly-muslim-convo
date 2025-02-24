
import React, { useState, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

export const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);

  const conversation = useConversation({
    overrides: {
      agent: {
        prompt: {
          prompt: `You are a helpful AI assistant focused on providing accurate and engaging responses.
                  Keep responses clear and concise, maintain a friendly tone, and be respectful.
                  If you're unsure about something, ask for clarification.`,
        },
        language: "en",
      },
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah's voice
      },
    },
    onConnect: () => {
      toast.success("Voice assistant connected");
    },
    onDisconnect: () => {
      setIsListening(false);
      toast.info("Voice assistant disconnected");
    },
    onMessage: (message) => {
      if (message.type === "speech-recognition") {
        // Handle user speech
        setMessages(prev => [...prev, { role: "user", content: message.content }]);
      } else if (message.type === "agent-response") {
        // Handle AI response
        setMessages(prev => [...prev, { role: "assistant", content: message.content }]);
      }
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
      setIsListening(false);
    },
  });

  useEffect(() => {
    // Request microphone access when component mounts
    const requestMicrophoneAccess = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        toast.error("Microphone access denied");
      }
    };
    requestMicrophoneAccess();
  }, []);

  const startListening = async () => {
    try {
      await conversation.startSession({
        agentId: "your-agent-id" // Replace with your ElevenLabs agent ID
      });
      setIsListening(true);
    } catch (error) {
      toast.error("Failed to start listening");
    }
  };

  const stopListening = async () => {
    try {
      await conversation.endSession();
      setIsListening(false);
    } catch (error) {
      toast.error("Failed to stop listening");
    }
  };

  const toggleVolume = async () => {
    try {
      if (conversation.isSpeaking) {
        await conversation.setVolume({ volume: 0 });
      } else {
        await conversation.setVolume({ volume: 1 });
      }
    } catch (error) {
      toast.error("Failed to toggle volume");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">AI Voice Assistant</h1>
        <p className="text-muted-foreground">
          Click the microphone to start a conversation
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          onClick={isListening ? stopListening : startListening}
          className="h-16 w-16 rounded-full"
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={toggleVolume}
          className="h-16 w-16 rounded-full"
        >
          {conversation.isSpeaking ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === "user"
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            } max-w-[80%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}
          >
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceAssistant;
