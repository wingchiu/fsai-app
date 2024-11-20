'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Loader2, Upload, Camera, Plus, Sparkles, Shirt, X } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Replicate from "replicate";
import { getUserIdentifier } from '@/lib/session';

// Initialize Replicate with the API key from environment variables
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // Use the API key here
});

export function MainScreenComponent({ initialFullBodyPhotos = [] }: { initialFullBodyPhotos?: string[] }) {
  const [fullBodyPhotos, setFullBodyPhotos] = useState<string[]>(initialFullBodyPhotos.slice(0, 3))
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(fullBodyPhotos[0] || null)
  const [clothingPhoto, setClothingPhoto] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId] = useState(() => getUserIdentifier());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUserImages = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`/api/files?userId=${userId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const { files } = await response.json();
        const timestamp = Date.now();
        
        const bodyPhotos = files
          .filter(f => f.includes('-body'))
          .sort((a, b) => {
            const indexA = parseInt(a.match(/body(\d+)/)?.[1] || '0');
            const indexB = parseInt(b.match(/body(\d+)/)?.[1] || '0');
            return indexA - indexB;
          })
          .map(f => `/images/${f}?t=${timestamp}`);
        
        const clothingPhotos = files
          .filter(f => f.includes('-cloth'))
          .map(f => `/images/${f}?t=${timestamp}`);
        
        setFullBodyPhotos(bodyPhotos);
        setSelectedPhoto(bodyPhotos[0] || null);
        setClothingPhoto(clothingPhotos[0] || null);
        
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out');
        } else {
          console.error('Error loading images:', error);
        }
      }
    };
    
    loadUserImages();
  }, [userId]);

  const handleBodyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && fullBodyPhotos.length < 3) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const nextIndex = fullBodyPhotos.length + 1;
          const response = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: reader.result,
              type: 'body',
              index: nextIndex,
              userId
            })
          });

          if (response.ok) {
            const { fileName } = await response.json();
            const newPhoto = `/images/${fileName}?t=${Date.now()}`;
            setFullBodyPhotos(prev => [...prev, newPhoto]);
            setSelectedPhoto(newPhoto);
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          alert('Failed to upload photo. Please try again.');
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleClothingPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          // Delete existing clothing photo if any
          if (clothingPhoto) {
            const oldFileName = clothingPhoto.split('/').pop();
            await fetch(`/api/files?userId=${userId}&fileName=${oldFileName}`, {
              method: 'DELETE',
            });
          }

          // Upload new photo
          const response = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData: reader.result,
              type: 'cloth',
              index: 1,
              userId
            })
          });

          if (response.ok) {
            const { fileName } = await response.json();
            setClothingPhoto(`/images/${fileName}`);
            setShowUploadDialog(false);
            
            // Force reload the image by adding a timestamp
            const timestamp = new Date().getTime();
            setClothingPhoto(`/images/${fileName}?t=${timestamp}`);
          }
        } catch (error) {
          console.error('Error handling clothing photo:', error);
          alert('Failed to upload clothing photo. Please try again.');
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Here you would typically open a camera UI
      console.log("Camera accessed")
      stream.getTracks().forEach(track => track.stop())
      setShowUploadDialog(false)
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Could not access camera. Please try uploading a photo instead.")
    }
  }

  const handleGenerate = async () => {
    if (!clothingPhoto || !selectedPhoto) {
      alert('Please select a full body photo and upload a clothing photo.');
      return;
    }

    setIsGenerating(true);
    try {
      const input = {
        garm_img: `${process.env.NEXT_PUBLIC_BASE_URL}${clothingPhoto}`,
        human_img: `${process.env.NEXT_PUBLIC_BASE_URL}${selectedPhoto}`,
        garment_des: "clothing item"
      };

      console.log("input for replicate:", input)

      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const { fileName } = await response.json();
      setResult(`/images/${fileName}`);
    } catch (error) {
      console.error("Error running Replicate model:", error);
      alert('Failed to generate image. Please check the console for more details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGeneration = () => {
    setResult(null)
    setClothingPhoto(null)
  }

  const handleDeletePhoto = async (indexToDelete: number) => {
    try {
      setIsLoading(true); // Add loading state if not already present
      
      // 1. Get current photos and create a copy of the array
      const currentPhotos = [...fullBodyPhotos];
      const photoToDelete = currentPhotos[indexToDelete];
      const fileNameToDelete = photoToDelete.split('/').pop()?.split('?')[0];

      // 2. Delete the file first
      const deleteResponse = await fetch(`/api/files?userId=${userId}&fileName=${fileNameToDelete}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete photo');
      }

      // 3. Remove the deleted photo from our array
      currentPhotos.splice(indexToDelete, 1);

      // 4. Sequentially rename remaining files
      for (let i = 0; i < currentPhotos.length; i++) {
        const currentFileName = currentPhotos[i].split('/').pop()?.split('?')[0];
        const newFileName = `${userId}-body${i + 1}.jpg`;

        if (currentFileName !== newFileName) {
          const renameResponse = await fetch('/api/files/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              oldFileName: currentFileName,
              newFileName,
            }),
          });

          if (!renameResponse.ok) {
            throw new Error(`Failed to rename file from ${currentFileName} to ${newFileName}`);
          }

          // Update the URL in our array with the new filename and a timestamp
          currentPhotos[i] = `/images/${newFileName}?t=${Date.now()}`;
        }
      }

      // 5. Update state with reordered photos
      setFullBodyPhotos(currentPhotos);
      
      // 6. Update selected photo if necessary
      if (selectedPhoto === photoToDelete) {
        setSelectedPhoto(currentPhotos[0] || null);
      }

    } catch (error) {
      console.error('Error during photo deletion:', error);
      alert('Failed to delete photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isGenerating) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Generating Your Style</CardTitle>
          <CardDescription>Please wait while we create your virtual outfit</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg">This may take a few moments...</p>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Your Styled Look</CardTitle>
          <CardDescription>Here's how the clothing item looks on you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-[3/4] mb-4">
            <Image
              src={result}
              alt="Generated result"
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-contain rounded-md"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={resetGeneration} variant="outline">
            Try Another
          </Button>
          <Button onClick={() => window.print()}>
            Save Image
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Image
              src="/images/fslogo.png"
              alt="FashionStyle.ai Logo"
              width={200}  // Adjust these dimensions based on your logo
              height={60}  // Adjust these dimensions based on your logo
              priority  // Add priority to load the logo first
            />
          </div>
          <CardDescription>
            Select a full body photo and upload a clothing item to style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {fullBodyPhotos.map((photo, index) => (
                <div key={index} className="relative w-24 h-32 shrink-0">
                  <Image
                    src={photo}
                    alt={`Full body photo ${index + 1}`}
                    fill
                    sizes="(max-width: 96px) 100vw, 96px"
                    className={`object-cover rounded-md cursor-pointer ${selectedPhoto === photo ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(index);
                    }}
                    disabled={isLoading}
                    className={`absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {fullBodyPhotos.length < 3 && (
                <div className="w-24 h-32 flex items-center justify-center border-2 border-dashed rounded-md cursor-pointer"
                     onClick={() => document.getElementById('body-photo-upload')?.click()}>
                  <Plus className="w-8 h-8 text-gray-400" />
                  <input
                    id="body-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBodyPhotoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div 
            className="w-full aspect-[3/4] bg-gray-100 rounded-md flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => setShowUploadDialog(true)}
          >
            {clothingPhoto ? (
              <div className="relative w-full aspect-square mb-4">
                <Image
                  src={clothingPhoto}
                  alt="Selected clothing item"
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-contain rounded-md"
                />
              </div>
            ) : (
              <>
                <Shirt className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-muted-foreground text-center px-4">
                  Click to upload or take a photo of the clothing you like
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleClothingPhotoChange}
              className="hidden"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerate} 
            disabled={!clothingPhoto || !selectedPhoto} 
            className="w-full group relative overflow-hidden"
          >
            <span className="relative z-10">Generate</span>
            <Sparkles className="w-5 h-5 ml-2 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Clothing Photo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-32 space-y-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8" />
              <span>Upload Photo</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-32 space-y-2"
              onClick={handleTakePhoto}
            >
              <Camera className="h-8 w-8" />
              <span>Take Photo</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}