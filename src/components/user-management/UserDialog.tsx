
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ManagedUser, UserRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (user: ManagedUser) => void;
  user: ManagedUser | null; // null for add mode, ManagedUser object for edit mode
  availableRoles: UserRole[];
  existingUsernames: string[]; // To check for duplicates when adding
}

export function UserDialog({ open, onOpenChange, onSave, user, availableRoles, existingUsernames }: UserDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!user;

  const [formData, setFormData] = useState<Partial<ManagedUser>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        setFormData({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        });
      } else {
        setFormData({
          id: "", // For new user, ID will be set to username on save
          username: "",
          name: "",
          role: "cashier", // Default role
        });
      }
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, user, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalUsername = (formData.username || "").trim();
    const finalName = (formData.name || "").trim();

    if (!finalUsername || !finalName) {
      toast({ variant: "destructive", title: "Validation Error", description: "Username and Display Name are required." });
      setIsSubmitting(false);
      return;
    }

    if (!isEditMode && existingUsernames.map(name => name.toLowerCase()).includes(finalUsername.toLowerCase())) {
        toast({ variant: "destructive", title: "Username Exists", description: "This username is already taken. Please choose another." });
        setIsSubmitting(false);
        return;
    }

    if (password || !isEditMode) { // Password is required for new users or if being changed for existing
      if (password.length < 3) { // Basic length check
        toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 3 characters long." });
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
        setIsSubmitting(false);
        return;
      }
    }
    
    const userToSave: ManagedUser = {
      id: isEditMode ? user!.id : "", // Will be set to username by parent if new
      username: finalUsername,
      name: finalName,
      role: formData.role || "cashier",
      ...(password && { password: password }), // Only include password if it's set
    };

    onSave(userToSave);
    setIsSubmitting(false);
    // onOpenChange(false); // Dialog will be closed by parent page after successful save
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update details for @${user?.username}.` : "Create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
              required
              disabled={isEditMode}
              className="mt-1"
              autoComplete="off"
            />
            {isEditMode && <p className="text-xs text-muted-foreground mt-1">Username cannot be changed.</p>}
          </div>
          <div>
            <Label htmlFor="name">Display Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role || "cashier"} onValueChange={handleRoleChange}>
              <SelectTrigger id="role" className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Label htmlFor="password">{isEditMode ? "New Password (Optional)" : "Password *"}</Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEditMode}
              className="mt-1 pr-10"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>

          <div className="relative">
            <Label htmlFor="confirmPassword">{isEditMode && !password ? "Confirm New Password (if changing)" : "Confirm Password *"}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!isEditMode || !!password} // Required if new user or if password field is filled
              className="mt-1 pr-10"
              autoComplete="new-password"
              disabled={!isEditMode && !password && isEditMode && !password} // disable if editing and password field is empty
            />
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={!password && isEditMode}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showConfirmPassword ? "Hide confirm password" : "Show confirm password"}</span>
            </Button>
          </div>
           {isEditMode && <p className="text-xs text-muted-foreground -mt-2">Leave password fields blank to keep the current password.</p>}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (isEditMode ? "Update User" : "Add User")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
