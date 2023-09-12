export default function Home() {
  const handleSend = async () => {
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "",
      });

      console.log(await response.text());
    } finally {
    }
  };

  return (
    <>
      <div>Hello am I a page?</div>
      <button onClick={handleSend}>Click me</button>
    </>
  );
}
