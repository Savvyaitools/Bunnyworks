import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Loader2, Download, Wand2, RotateCcw, Sparkles, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type ModelOption = {
  id: string;
  label: string;
  description: string;
};

const MODELS: ModelOption[] = [
  { id: "google/gemini-3-pro-image-preview", label: "Pro (Best Quality)", description: "Highest quality, slower" },
  { id: "google/gemini-3.1-flash-image-preview", label: "Flash (Fast + Quality)", description: "Pro-level quality, faster" },
  { id: "google/gemini-2.5-flash-image", label: "Nano (Fastest)", description: "Quick generations, good quality" },
];

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ prompt: string; image: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-image-generate", {
        body: { prompt: prompt.trim(), model, editImage: editImage || undefined },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const imageUrl = data.image;
      setGeneratedImage(imageUrl);
      setHistory(prev => [{ prompt: prompt.trim(), image: imageUrl }, ...prev].slice(0, 12));
      toast.success("Image generated!");
    } catch (err: any) {
      console.error("Image generation error:", err);
      if (err.message?.includes("429") || err.message?.includes("Rate limit")) {
        toast.error("Rate limit reached. Please wait a moment and try again.");
      } else if (err.message?.includes("402") || err.message?.includes("credits")) {
        toast.error("AI credits exhausted. Please add credits in Settings.");
      } else {
        toast.error(err.message || "Failed to generate image");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `naked-savvy-${Date.now()}.png`;
    link.click();
  };

  const handleEditUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditImage(reader.result as string);
      toast.success("Image loaded for editing");
    };
    reader.readAsDataURL(file);
  };

  const handleUseAsBase = () => {
    if (generatedImage) {
      setEditImage(generatedImage);
      toast.success("Using generated image as edit base");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1200px]">
        <PageHeader
          title="Naked Savvy"
          subtitle="Generate and edit images with AI — powered by Gemini"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create... e.g. 'A glamorous photoshoot in a luxury penthouse, golden hour lighting, editorial style'"
                    className="min-h-[120px] resize-none"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{prompt.length}/2000</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <span>{m.label}</span>
                            <span className="text-xs text-muted-foreground">— {m.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Edit image upload */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Edit an Image (optional)</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Image
                    </Button>
                    {editImage && (
                      <Button variant="ghost" size="sm" onClick={() => setEditImage(null)}>
                        Clear
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditUpload}
                  />
                  {editImage && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border w-24 h-24">
                      <img src={editImage} alt="Edit base" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {editImage ? "Edit Image" : "Generate Image"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick prompts */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Quick Prompts</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Luxury bedroom photoshoot, soft lighting",
                    "Beach sunset, editorial fashion style",
                    "Urban rooftop, neon city lights, moody",
                    "Cozy boudoir, warm candle glow",
                    "High-fashion studio, dramatic shadows",
                    "Poolside glamour, tropical vibes",
                  ].map((q) => (
                    <Badge
                      key={q}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent/10 transition-colors text-xs"
                      onClick={() => setPrompt(q)}
                    >
                      {q}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Panel */}
          <div className="space-y-4">
            <Card className="border-border min-h-[400px] flex items-center justify-center">
              <CardContent className="p-5 w-full">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16 gap-4"
                    >
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Wand2 className="h-7 w-7 text-primary animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Creating your image...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take 10-30 seconds</p>
                      </div>
                    </motion.div>
                  ) : generatedImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="rounded-xl overflow-hidden border border-border">
                        <img
                          src={generatedImage}
                          alt="Generated"
                          className="w-full h-auto max-h-[500px] object-contain bg-muted/30"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleDownload} variant="outline" size="sm" className="gap-1.5">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button onClick={handleUseAsBase} variant="outline" size="sm" className="gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Edit This
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 gap-3 text-center"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Your generated image will appear here</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* History */}
            {history.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent Generations</p>
                  <div className="grid grid-cols-4 gap-2">
                    {history.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setGeneratedImage(item.image)}
                        className="rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors aspect-square"
                        title={item.prompt}
                      >
                        <img src={item.image} alt={item.prompt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
