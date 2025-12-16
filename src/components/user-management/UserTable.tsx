
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal, Users2 } from "lucide-react";
import type { ManagedUser } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface UserTableProps {
  users: ManagedUser[];
  onEditUser: (user: ManagedUser) => void;
  onDeleteUser: (userId: string) => void;
  currentUserUsername: string;
}

export function UserTable({ users, onEditUser, onDeleteUser, currentUserUsername }: UserTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<ManagedUser | null>(null);

  const openDeleteConfirmation = (user: ManagedUser) => {
    setUserToDelete(user);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
    }
    setIsDeleteAlertOpen(false);
    setUserToDelete(null);
  };

  if (users.length === 0) {
    return (
      <Card className="shadow-md text-center">
        <CardHeader>
          <CardTitle className="font-headline">System Users</CardTitle>
        </CardHeader>
        <CardContent className="py-10">
          <Users2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found.</p>
          <p className="text-sm text-muted-foreground">Click "Add New User" to create the first user account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">System Users ({users.length})</CardTitle>
          <CardDescription>List of all user accounts with access to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-primary">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1 capitalize text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteConfirmation(user)}
                            className="text-destructive focus:text-destructive"
                            disabled={user.username === currentUserUsername || (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[calc(100vh-26rem)]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">@{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEditUser(user)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteConfirmation(user)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              disabled={user.username === currentUserUsername || (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User: {userToDelete?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              The user's access to the system will be revoked immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
