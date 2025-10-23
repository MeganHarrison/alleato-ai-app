'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFullName: string | null;
}

interface FormData {
  fullName: string;
}

export const SettingsModal = ({ isOpen, onClose, currentFullName }: SettingsModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      fullName: currentFullName || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No authenticated user found");
      
      // Update the profile in the user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ full_name: data.fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Also update the user metadata for consistency
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: data.fullName }
      });
      
      if (userError) throw userError;
      
      toast({
        title: "Profile updated",
        description: "Your full name has been updated successfully.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Update failed",
        description: (error as Error)?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input
                id="fullName"
                {...register("fullName", { required: "Full name is required" })}
                className="col-span-3"
              />
              {errors.fullName && (
                <p className="col-span-3 col-start-2 text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};