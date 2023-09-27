import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationEventSchema } from "@/lib/ApplicationEvent";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { readEventSourceStream } from "modelfusion";

export default function Home() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [waitingForUserInput, setWaitingForUserInput] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [activePart, setActivePart] = useState(0);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  const startRecording = () => {
    if (isRecording) return;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && isRecording) {
      mediaRecorder.onstop = async () => {
        setWaitingForUserInput(false);
        setGeneratingStory(true);
        setShouldAutoPlay(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/mp3",
          });
          const formData = new FormData();
          formData.append("audio", audioBlob, "audio.mp3");

          const baseUrl = "http://localhost:3001";

          const response = await fetch(`${baseUrl}/generate-story`, {
            method: "POST",
            body: formData,
          });

          audioChunksRef.current = [];
          mediaRecorder.stream?.getTracks().forEach((track) => track.stop()); // stop microphone access

          const path: string = (await response.json()).path;

          const eventStreamResponse = await fetch(`${baseUrl}${path}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          const events = readEventSourceStream({
            stream: eventStreamResponse.body!,
            schema: applicationEventSchema,
            errorHandler: console.error,
          });

          for await (const event of events) {
            switch (event.type) {
              case "transcribed-input": {
                setInput(event.input);
                break;
              }
              case "generated-image": {
                setImageUrl(`${baseUrl}${event.path}`);
                break;
              }
              case "generated-title": {
                setTitle(event.title);
                break;
              }
              case "generated-audio-part": {
                audioUrls[event.index] = `${baseUrl}${event.path}`;
                setAudioUrls(audioUrls.slice());
              }
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setGeneratingStory(false);
        }
      };

      mediaRecorder.stop();

      setIsRecording(false);
    }
  };

  const onPlaybackEnded = () => {
    if (activePart === audioUrls.length - 1) {
      setActivePart(0);
      setShouldAutoPlay(false);
    } else {
      setActivePart(activePart + 1);
    }
  };

  return (
    <div className="mx-auto p-5 max-w-[542px]">
      {waitingForUserInput ? (
        <Card>
          <CardHeader>
            <CardTitle>Story Teller</CardTitle>
            <CardDescription>
              An automated story generation experiment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onContextMenu={(e) => e.preventDefault()}
              variant="outline"
            >
              Generate Story for Pre-Schoolers
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            {input ? (
              <CardDescription>&quot;{input}&quot;</CardDescription>
            ) : (
              <Skeleton className="h-5 w-full" />
            )}
            <CardTitle>
              {title ?? <Skeleton className="h-10 w-full" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {imageUrl != null ? (
              <div className="w-full">
                <AspectRatio ratio={1 / 1}>
                  <img
                    src={imageUrl}
                    alt={title ?? ""}
                    className="rounded-md object-cover w-full"
                  />
                </AspectRatio>
              </div>
            ) : (
              <Skeleton className="h-52 w-full" />
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            {audioUrls[activePart] != null ? (
              <>
                <audio
                  controls
                  controlsList="nodownload nofullscreen noremoteplayback"
                  autoPlay={shouldAutoPlay}
                  src={audioUrls[activePart]}
                  onEnded={onPlaybackEnded}
                />
                <span>
                  Part {activePart + 1} /{" "}
                  {generatingStory ? "..." : audioUrls.length}
                </span>
              </>
            ) : (
              <Skeleton className="h-12 w-full" />
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
