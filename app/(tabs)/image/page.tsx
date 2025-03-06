import ClientSideWrapper from "./components/client/ClientSideWrapper";

export default function ImagePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Text to Image</h1>
      </div>
      
      <ClientSideWrapper />
    </div>
  );
} 