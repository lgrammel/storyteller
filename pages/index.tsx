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

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      });

      const events = readEvents(response.body!, applicationEventSchema, {
        errorHandler: console.error,
      });

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
          {image && <img src={image} alt={title ?? ""} />}
        </>
      )}
    </>
  );
}
