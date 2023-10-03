import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { delay } from "@/lib/delay";
import { storytellerEventSchema } from "@/storyteller/StorytellerEvent";
import { Loader2, Mic } from "lucide-react";
import { ZodSchema, readEventSource } from "modelfusion";
import { useRef, useState } from "react";

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

          readEventSource({
            url: `${baseUrl}${path}`,
            schema: new ZodSchema(storytellerEventSchema),
            onEvent(event, eventSource) {
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
                  break;
                }
                case "finished-generation": {
                  setGeneratingStory(false);
                  eventSource.close();
                  break;
                }
              }
            },
          });
        } catch (error) {
          console.error(error);
        }
      };

      mediaRecorder.stop();

      setIsRecording(false);
    }
  };

  const onPlaybackEnded = async () => {
    if (activePart === audioUrls.length - 1) {
      setActivePart(0);
      setShouldAutoPlay(false);
    } else {
      await delay(1000); // delay between parts to improve the quality of the story
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
              Automatically generate stories for pre-school kids.
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
              {!isRecording ? (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Record topic
                </>
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <i>Recording…</i>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            {input ? (
              <CardDescription>&quot;{input}&quot;</CardDescription>
            ) : (
              <Skeleton className="h-4 w-full" />
            )}
            <CardTitle>
              {title ?? <Skeleton className="h-8 w-full" />}
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
              <Skeleton className="h-96 w-full" />
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
              <Skeleton className="h-16 w-full" />
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
