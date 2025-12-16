
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Keep this for when a trigger is passed
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "@/lib/types";
import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const defaultCustomerData: Omit<Customer, 'id' | 'avatar'> = {
  name: "",
  phone: "",
  address: "",
  shopName: "",
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface CustomerDialogProps {
  customer?: Customer | null;
  trigger?: React.ReactNode;
  onSave: (customer: Customer) => Promise<void>; // Make onSave async
  isEditMode?: boolean;
  open: boolean; // Control open state from parent
  onOpenChange: (isOpen: boolean) => void; // Control open state from parent
  initialStatus?: 'active' | 'pending';
}

export function CustomerDialog({
  customer,
  trigger,
  onSave,
  isEditMode = false,
  open,
  onOpenChange,
  initialStatus = 'active'
}: CustomerDialogProps) {
  const [formData, setFormData] = useState<Partial<Omit<Customer, 'id' | 'avatar'>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const userRole = currentUser?.role;

  const actualIsEditMode = !!customer && isEditMode;

  const canEditFields = !actualIsEditMode || userRole === 'admin';
  const canSubmitForm = actualIsEditMode ? userRole === 'admin' : (userRole === 'admin' || userRole === 'cashier');

  useEffect(() => {
    if (open) {
      if (actualIsEditMode && customer) {
        setFormData({
          name: customer.name,
          phone: customer.phone,
          address: customer.address || "",
          shopName: customer.shopName || "",
          status: customer.status || 'active',
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        });
      } else {
        setFormData({ ...defaultCustomerData, status: initialStatus });
      }
    }
  }, [open, customer, actualIsEditMode, initialStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: 'active' | 'pending') => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Full Name and Phone Number are required.",
      });
      return;
    }

    if (!canSubmitForm) {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to perform this action.",
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const customerDataToSave: Customer = {
        id: customer?.id || Date.now().toString(),
        avatar: customer?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name!)}`,
        name: formData.name!,
        phone: formData.phone!,
        address: formData.address,
        shopName: formData.shopName,
        status: formData.status,
        createdAt: formData.createdAt || new Date(),
        updatedAt: new Date(),
        name_lowercase: formData.name!.toLowerCase(), // Ensure lowercase field is added
        shopName_lowercase: formData.shopName?.toLowerCase(), // Ensure lowercase field is added
      };
      await onSave(customerDataToSave);
    } catch (error) {
      console.error("Failed to save customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const dialogTitle = actualIsEditMode ? "Edit Customer" : "Add New Customer";
  const dialogDescription = actualIsEditMode ? "Update customer details below." : "Fill in the customer information.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block mb-2 font-medium">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={!canEditFields || isSubmitting}
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="block mb-2 font-medium">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  required
                  disabled={!canEditFields || isSubmitting}
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="shopName" className="block mb-2 font-medium">Shop Name</Label>
                <Input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName || ''}
                  onChange={handleChange}
                  placeholder="Doe's Shop"
                  disabled={!canEditFields || isSubmitting}
                  className="h-11"
                />
              </div>
              <div>
                <Label htmlFor="address" className="block mb-2 font-medium">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="123 Main St, City"
                  disabled={!canEditFields || isSubmitting}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status" className="block mb-2 font-medium">Customer Status</Label>
                <Select
                  name="status"
                  value={formData.status || 'active'}
                  onValueChange={handleStatusChange}
                  disabled={!canEditFields || isSubmitting}
                >
                  <SelectTrigger id="status" className="h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {canSubmitForm && (
              <Button type="submit" disabled={isSubmitting || !formData.name || !formData.phone}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  actualIsEditMode ? "Update Customer" : "Add Customer"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
