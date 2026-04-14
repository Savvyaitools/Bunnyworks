import { useEffect } from "react";

const Workshop = () => {
  useEffect(() => {
    window.location.replace("/workshop.html");
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <a
        href="/workshop.html"
        className="text-primary underline underline-offset-4"
      >
        Open workshop page
      </a>
    </div>
  );
};

export default Workshop;

