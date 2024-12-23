import React, { useState } from 'react';
import ThreeViewer from '@/components/ThreeViewer';
import Calculator from '@/components/Calculator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SAMPLE_MODELS = [
  {
    name: 'Cube',
    url: 'https://storage.googleapis.com/ucloud-v3/ccab50f18fb14c91ccca300a.stl'
  },
  {
    name: 'Sphere',
    url: 'https://storage.googleapis.com/ucloud-v3/6cc1b1f18fb14c91ccca300a.stl'
  },
  {
    name: 'Cylinder',
    url: 'https://storage.googleapis.com/ucloud-v3/7cc2b2f18fb14c91ccca300a.stl'
  },
  {
    name: 'Torus',
    url: 'https://storage.googleapis.com/ucloud-v3/8cc3b3f18fb14c91ccca300a.stl'
  }
];

const Index = () => {
  const [selectedModel, setSelectedModel] = useState(SAMPLE_MODELS[0].url);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedModel(url);
      toast.success('Model loaded successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left sidebar */}
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Sample Models</h2>
              <div className="space-y-2">
                {SAMPLE_MODELS.map((model) => (
                  <Button
                    key={model.name}
                    onClick={() => setSelectedModel(model.url)}
                    variant={selectedModel === model.url ? "default" : "secondary"}
                    className="w-full"
                  >
                    {model.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-card rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Upload STL</h2>
              <input
                type="file"
                accept=".stl"
                onChange={handleFileUpload}
                className="block w-full text-sm text-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-foreground
                  hover:file:bg-primary/90"
              />
            </div>

            <Calculator />
          </div>

          {/* 3D Viewer */}
          <div className="lg:col-span-3 bg-card rounded-lg" style={{ height: '80vh' }}>
            <ThreeViewer stlUrl={selectedModel} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;