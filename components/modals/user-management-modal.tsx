"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// shadcn/ui imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useUserManagementModal } from "../../hooks/use-userManagementModal";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username/Email is required." }),
  roleId: z.string().min(1, { message: "Please select a role." }),
});

type UserManagementFormValues = z.infer<typeof formSchema>;

export const UserManagementModal = () => {
  const { isOpen, onClose, initialData, roles } = useUserManagementModal();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);

  const isEditMode = !!initialData;
  const title = isEditMode ? "Update User Role" : "Assign User";
  const description = isEditMode
    ? "Change the role for this user."
    : "Assign an existing user to this business unit by their username/email.";
  const action = isEditMode ? "Save changes" : "Assign";

  const form = useForm<UserManagementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      roleId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        username: initialData.username || "",
        roleId: initialData.roleId,
      });
    } else {
      form.reset({ username: "", roleId: "" });
    }
  }, [initialData, form]);

  const onSubmit = async (data: UserManagementFormValues) => {
    try {
      setLoading(true);
      if (isEditMode && initialData) {
        await axios.patch(
          `/api/${params.businessUnitId}/user-management/${initialData.userId}`,
          data
        );
      } else {
        await axios.post(
          `/api/${params.businessUnitId}/user-management`,
          data
        );
      }
      router.refresh();
      toast.success(isEditMode ? "User role updated." : "User assigned successfully.");
      onClose();
    } catch (error) {
      toast.error(`Something went wrong. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username (Email)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading || isEditMode}
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditMode 
                      ? "Username cannot be changed in edit mode." 
                      : "Enter the username or email of the user to assign."
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the appropriate role for this user in your business unit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="ml-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isEditMode ? "Updating..." : "Assigning..."}
                  </>
                ) : (
                  action
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};