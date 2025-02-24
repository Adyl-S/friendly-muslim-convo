
import React, { useState, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const ERROR_MESSAGES = {
  MICROPHONE_ACCESS: "Please enable microphone access to use the voice assistant",
  CONNECTION_FAILED: "Failed to connect to the voice service. Please try again",
  SESSION_START: "Could not start voice session. Please check your connection",
  SESSION_END: "Error ending voice session",
  VOLUME_CONTROL: "Could not adjust volume",
  NETWORK: "Network error. Please check your internet connection",
  UNKNOWN: "An unexpected error occurred. Please try again",
};

export const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [hasError, setHasError] = useState(false);

  const handleError = (error: Error, customMessage?: string) => {
    console.error("Voice Assistant Error:", error);
    setHasError(true);
    setIsListening(false);
    
    // Display error message with retry option
    toast.error(customMessage || ERROR_MESSAGES.UNKNOWN, {
      action: {
        label: "Retry",
        onClick: () => {
          setHasError(false);
          startListening();
        },
      },
    });
  };

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
      setHasError(false);
      toast.success("Voice assistant connected");
    },
    onDisconnect: () => {
      setIsListening(false);
      if (!hasError) {
        toast.info("Voice assistant disconnected");
      }
    },
    onMessage: (message) => {
      try {
        if (message.type === "speech-recognition") {
          setMessages(prev => [...prev, { role: "user", content: message.content }]);
        } else if (message.type === "agent-response") {
          setMessages(prev => [...prev, { role: "assistant", content: message.content }]);
        }
      } catch (error) {
        handleError(error as Error, "Error processing message");
      }
    },
    onError: (error) => {
      handleError(error, ERROR_MESSAGES.CONNECTION_FAILED);
    },
  });

  useEffect(() => {
    const requestMicrophoneAccess = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasError(false);
      } catch (error) {
        handleError(error as Error, ERROR_MESSAGES.MICROPHONE_ACCESS);
      }
    };
    requestMicrophoneAccess();

    // Cleanup function
    return () => {
      if (isListening) {
        conversation.endSession().catch(error => {
          console.error("Error during cleanup:", error);
        });
      }
    };
  }, []);

  const startListening = async () => {
    if (hasError) {
      return;
    }

    try {
      await conversation.startSession({
        agentId: "your-agent-id" // Replace with your ElevenLabs agent ID
      });
      setIsListening(true);
    } catch (error) {
      handleError(error as Error, ERROR_MESSAGES.SESSION_START);
    }
  };

  const stopListening = async () => {
    try {
      await conversation.endSession();
      setIsListening(false);
    } catch (error) {
      handleError(error as Error, ERROR_MESSAGES.SESSION_END);
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
      handleError(error as Error, ERROR_MESSAGES.VOLUME_CONTROL);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">AI Voice Assistant</h1>
        <p className="text-muted-foreground">
          {hasError 
            ? "Error connecting to voice service" 
            : "Click the microphone to start a conversation"}
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          size="lg"
          variant={isListening ? "destructive" : "default"}
          onClick={isListening ? stopListening : startListening}
          className="h-16 w-16 rounded-full"
          disabled={hasError}
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
          disabled={hasError || !conversation.isSpeaking}
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
