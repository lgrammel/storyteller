import { applicationEventSchema } from "@/lib/ApplicationEvent";
import { readEvents } from "@/lib/readEvents";
import React from "react";

export default function Home() {
  const [waitingForUserInput, setWaitingForUserInput] = React.useState(true);
  const [image, setImage] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState<string | null>(null);

  const onSubmit = async () => {
    try {
      setWaitingForUserInput(false);

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
        {
          errorHandler: console.error,
        }
      );

      for await (const event of events) {
        // TODO clean this up
        if (event == null) {
          continue;
        }

        switch (event.type) {
          case "imageGenerated":
            setImage(event.image);
            break;
          case "titleGenerated":
            setTitle(event.title);
            break;
        }
      }
      console.log("Done");
    } finally {
    }
  };

  return (
    <>
      {waitingForUserInput ? (
        <button onClick={onSubmit}>Generate Story</button>
      ) : (
        <>
          {title && <h2>{title}</h2>}
          {image && (
            <img
              src={`data:image/png;base64,${image}`}
              alt={title ?? ""}
              style={{ maxWidth: "100%" }}
            />
          )}
        </>
      )}
    </>
  );
}
