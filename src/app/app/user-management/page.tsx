
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-management/UserTable";
import { UserDialog } from "@/components/user-management/UserDialog";
import type { ManagedUser, UserRole } from "@/lib/types";
import { useAuth, availableRoles as allRoles } from "@/contexts/AuthContext";
import { PlusCircle, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useRouter } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";
import { useUsers } from "@/hooks/useUsers";

export default function UserManagementPage() {
  const { currentUser: loggedInUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { users, isLoading, error, addUser, updateUser, deleteUser } = useUsers();

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    if (loggedInUser === undefined) return;
    if (!loggedInUser) {
      router.replace("/");
      return;
    }
    if (loggedInUser.role !== "admin") {
      router.replace("/app/dashboard");
    }
  }, [loggedInUser, router]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.username === loggedInUser?.username) {
      toast({ variant: "destructive", title: "Action Prohibited", description: "You cannot delete your own account." });
      return;
    }
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        toast({ variant: "destructive", title: "Action Prohibited", description: "Cannot delete the last admin account." });
        return;
      }
    }
    
    deleteUser(userId);
  };

  const handleSaveUser = async (userToSave: ManagedUser) => {
    let success = false;
    if (editingUser) {
      success = await updateUser(userToSave.id, userToSave);
    } else {
      success = await addUser(userToSave);
    }
    
    if (success) {
      setIsUserDialogOpen(false);
      setEditingUser(null);
    }
  };
  
  if (isLoading && users.length === 0) {
    return <GlobalPreloaderScreen message="Loading user management..." />;
  }

  if (!loggedInUser || loggedInUser.role !== "admin") {
    return <AccessDenied message="You do not have permission to access User Management." />;
  }
  
  if (error) {
    return <AccessDenied message={`Error loading users: ${error}`} />;
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Add, edit, or remove user accounts."
        icon={UserCog}
        action={
          <Button onClick={handleAddUser}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Button>
        }
      />
      
      <UserTable
        users={users}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        currentUserUsername={loggedInUser.username}
      />

      {isUserDialogOpen && (
        <UserDialog
          open={isUserDialogOpen}
          onOpenChange={setIsUserDialogOpen}
          onSave={handleSaveUser}
          user={editingUser}
          availableRoles={allRoles}
          existingUsernames={users.map(u => u.username).filter(uname => uname !== editingUser?.username)}
        />
      )}
    </>
  );
}
