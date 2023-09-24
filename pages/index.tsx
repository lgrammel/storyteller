import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { applicationEventSchema } from "@/lib/ApplicationEvent";
import { readEvents } from "@/lib/readEvents";
import React from "react";

export default function Home() {
  const [waitingForUserInput, setWaitingForUserInput] = React.useState(true);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState<string | null>(null);
  const [audioUrls, setAudioUrls] = React.useState<string[]>([]);
  const [activePart, setActivePart] = React.useState(0);
  const [generatingStory, setGeneratingStory] = React.useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = React.useState(false);

  const onSubmit = async () => {
    try {
      setWaitingForUserInput(false);
      setGeneratingStory(true);
      setShouldAutoPlay(true);

      const topic = "a tale about an elephant on vacation";
      const baseUrl = "http://localhost:3001";

      const generateStoryResponse = await fetch(`${baseUrl}/generate-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const path: string = (await generateStoryResponse.json()).path;

      const eventStreamResponse = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const events = readEvents(
        eventStreamResponse.body!,
        applicationEventSchema,
        { errorHandler: console.error }
      );

      for await (const event of events) {
        // TODO clean this up
        if (event == null) {
          continue;
        }

        switch (event.type) {
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
    } finally {
      setGeneratingStory(false);
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
    <>
      {waitingForUserInput ? (
        <button onClick={onSubmit}>Generate Story</button>
      ) : (
        <div className="mx-auto p-5 max-w-[542px]">
          <Card>
            <CardHeader>
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
        </div>
      )}
    </>
  );
}
