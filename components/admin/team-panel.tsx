"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PasswordHandoff, TempPasswordField } from "@/components/admin/temp-password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STAFF_PERMISSION_LABELS,
  STAFF_PERMISSIONS,
  STAFF_PRESETS,
  generateTempPassword,
  type StaffPermission,
} from "@/lib/admin/staff-access";
import {
  addTeamMember,
  setTeamMemberActive,
  setTeamMemberPassword,
  updateTeamMember,
} from "@/lib/admin/team-actions";
import type { TeamMember } from "@/lib/admin/team";

function togglePermission(current: StaffPermission[], permission: StaffPermission): StaffPermission[] {
  return current.includes(permission)
    ? current.filter((item) => item !== permission)
    : STAFF_PERMISSIONS.filter((item) => item === permission || current.includes(item));
}

function PermissionPicker({
  selected,
  onChange,
}: {
  selected: StaffPermission[];
  onChange: (value: StaffPermission[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Uprawnienia</legend>
      <div className="flex flex-col gap-2">
        {STAFF_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            className="min-h-12 justify-start"
            onClick={() => onChange([...preset.permissions])}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="space-y-1">
        {STAFF_PERMISSIONS.map((permission) => (
          <label key={permission} className="flex min-h-12 items-center gap-3">
            <input
              type="checkbox"
              className="size-5"
              checked={selected.includes(permission)}
              onChange={() => onChange(togglePermission(selected, permission))}
            />
            {STAFF_PERMISSION_LABELS[permission]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function OwnerFields({
  ownerAccess,
  confirmOwner,
  onOwner,
  onConfirm,
}: {
  ownerAccess: boolean;
  confirmOwner: boolean;
  onOwner: (value: boolean) => void;
  onConfirm: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex min-h-12 items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={ownerAccess}
          onChange={(event) => {
            onOwner(event.target.checked);
            if (!event.target.checked) {
              onConfirm(false);
            }
          }}
        />
        Pełny dostęp właściciela
      </label>
      {ownerAccess ? (
        <label className="flex min-h-12 items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={confirmOwner}
            onChange={(event) => onConfirm(event.target.checked)}
          />
          Ta osoba zobaczy i zmieni wszystko, także ustawienia i zespół.
        </label>
      ) : null}
    </div>
  );
}

function AddEmployee({ onCreated }: { onCreated: (password: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<StaffPermission[]>([...STAFF_PRESETS[0].permissions]);
  const [password, setPassword] = useState(() => generateTempPassword());
  const [ownerAccess, setOwnerAccess] = useState(false);
  const [confirmOwner, setConfirmOwner] = useState(false);
  const [confirmShopAccount, setConfirmShopAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(shopConfirmed: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await addTeamMember({
        fullName,
        email,
        permissions,
        password,
        ownerAccess,
        confirmOwner,
        confirmShopAccount: shopConfirmed,
      });
      if (!result.ok) {
        setError(result.error);
        if (result.needsShopAccount) {
          setConfirmShopAccount(true);
        }
        return;
      }
      onCreated(result.password ?? password);
      router.refresh();
      setFullName("");
      setEmail("");
      setOwnerAccess(false);
      setConfirmOwner(false);
      setConfirmShopAccount(false);
      setPassword(generateTempPassword());
    });
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(confirmShopAccount);
      }}
    >
      <h2 className="text-xl font-semibold">Dodaj pracownika</h2>
      <div className="space-y-2">
        <Label htmlFor="team-name">Imię i nazwisko</Label>
        <Input id="team-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-email">E-mail (login do panelu)</Label>
        <Input
          id="team-email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setConfirmShopAccount(false);
          }}
          className="min-h-12"
        />
      </div>
      <PermissionPicker selected={permissions} onChange={setPermissions} />
      <TempPasswordField id="team-password" value={password} onChange={setPassword} />
      <OwnerFields
        ownerAccess={ownerAccess}
        confirmOwner={confirmOwner}
        onOwner={setOwnerAccess}
        onConfirm={setConfirmOwner}
      />
      {error ? <p className="text-sm text-[var(--adj-red)]">{error}</p> : null}
      {confirmShopAccount ? (
        <Button type="submit" className="min-h-12 w-full" disabled={isPending}>
          Nadaj dostęp do panelu
        </Button>
      ) : (
        <Button type="submit" className="min-h-12 w-full" disabled={isPending}>
          Dodaj pracownika
        </Button>
      )}
    </form>
  );
}

function MemberCard({ member, isSelf }: { member: TeamMember; isSelf: boolean }) {
  const [fullName, setFullName] = useState(member.fullName);
  const [permissions, setPermissions] = useState<StaffPermission[]>(member.permissions);
  const [ownerAccess, setOwnerAccess] = useState(member.role === "owner");
  const [confirmOwner, setConfirmOwner] = useState(false);
  const [password, setPassword] = useState("");
  const [handoff, setHandoff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <article className="space-y-4 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{member.fullName}</h2>
        <p className="break-all text-sm text-muted-foreground">{member.email}</p>
        <p className="text-sm">{member.isActive ? "Aktywny" : "Wyłączony"}</p>
        <p className="text-sm text-muted-foreground">Ostatnie logowanie: {member.lastSignInLabel}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {member.role === "owner" ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">Właścicielka</span>
          ) : (
            member.permissions.map((permission) => (
              <span key={permission} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                {STAFF_PERMISSION_LABELS[permission]}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`name-${member.id}`}>Imię i nazwisko</Label>
        <Input id={`name-${member.id}`} value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-12" />
      </div>
      <PermissionPicker selected={permissions} onChange={setPermissions} />
      {isSelf ? (
        <p className="text-sm leading-relaxed">To Twoje konto. Roli właścicielki nie odbierzesz sobie tutaj.</p>
      ) : (
        <OwnerFields
          ownerAccess={ownerAccess}
          confirmOwner={confirmOwner}
          onOwner={setOwnerAccess}
          onConfirm={setConfirmOwner}
        />
      )}
      {error ? <p className="text-sm text-[var(--adj-red)]">{error}</p> : null}
      <Button
        type="button"
        className="min-h-12 w-full"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateTeamMember({
              id: member.id,
              fullName,
              permissions,
              ownerAccess: isSelf ? true : ownerAccess,
              confirmOwner: isSelf ? true : confirmOwner,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        Zapisz uprawnienia
      </Button>

      <TempPasswordField id={`password-${member.id}`} value={password} onChange={setPassword} />
      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full"
        disabled={isPending || !password}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setTeamMemberPassword(member.id, password);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setHandoff(result.password ?? password);
            setPassword("");
            router.refresh();
          });
        }}
      >
        Ustaw nowe hasło
      </Button>
      {handoff ? <PasswordHandoff password={handoff} /> : null}

      <Button
        type="button"
        variant="outline"
        className="min-h-12 w-full"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setTeamMemberActive(member.id, !member.isActive);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {member.isActive ? "Wyłącz dostęp" : "Włącz dostęp"}
      </Button>
    </article>
  );
}

export function TeamPanel({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const [handoff, setHandoff] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {handoff ? <PasswordHandoff password={handoff} /> : null}
      <AddEmployee onCreated={setHandoff} />
      <div className="space-y-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} isSelf={member.id === currentUserId} />
        ))}
      </div>
    </div>
  );
}
