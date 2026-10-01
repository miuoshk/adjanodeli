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
  choicesFromGrants,
  generateTempPassword,
  permissionChip,
  permissionsFromChoices,
  type SectionChoice,
  type StaffPermission,
} from "@/lib/admin/staff-access";
import {
  addTeamMember,
  setTeamMemberActive,
  setTeamMemberPassword,
  updateTeamMember,
} from "@/lib/admin/team-actions";
import type { TeamMember } from "@/lib/admin/team";

const CHOICES: { id: SectionChoice; label: string }[] = [
  { id: "none", label: "Brak" },
  { id: "view", label: "Podgląd" },
  { id: "manage", label: "Pełny" },
];

function ChoiceButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "min-h-12 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          : "min-h-12 rounded-md bg-card px-3 text-sm ring-1 ring-[var(--adj-cream-dark)]"
      }
    >
      {label}
    </button>
  );
}

function PermissionPicker({
  choices,
  onChange,
  namePrefix,
}: {
  choices: Record<StaffPermission, SectionChoice>;
  onChange: (value: Record<StaffPermission, SectionChoice>) => void;
  namePrefix: string;
}) {
  function setChoice(section: StaffPermission, choice: SectionChoice) {
    onChange({ ...choices, [section]: choice });
  }

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
            onClick={() => onChange(choicesFromGrants(preset.grants))}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-[var(--adj-cream-dark)] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--adj-cream-dark)]">
              <th className="px-3 py-2 font-medium">Sekcja</th>
              <th className="px-3 py-2 font-medium">Brak</th>
              <th className="px-3 py-2 font-medium">Podgląd</th>
              <th className="px-3 py-2 font-medium">Pełny</th>
            </tr>
          </thead>
          <tbody>
            {STAFF_PERMISSIONS.map((section) => (
              <tr key={section} className="border-b border-[var(--adj-cream-dark)] last:border-0">
                <th className="px-3 py-2 text-left font-medium">{STAFF_PERMISSION_LABELS[section]}</th>
                {CHOICES.map((choice) => (
                  <td key={choice.id} className="px-3 py-2">
                    <input
                      type="radio"
                      name={`${namePrefix}-${section}`}
                      className="size-5"
                      checked={choices[section] === choice.id}
                      onChange={() => setChoice(section, choice.id)}
                      aria-label={`${STAFF_PERMISSION_LABELS[section]}: ${choice.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {STAFF_PERMISSIONS.map((section) => (
          <div key={section} className="space-y-2">
            <p className="text-sm font-medium">{STAFF_PERMISSION_LABELS[section]}</p>
            <div className="grid grid-cols-3 gap-2">
              {CHOICES.map((choice) => (
                <ChoiceButton
                  key={choice.id}
                  label={choice.label}
                  selected={choices[section] === choice.id}
                  onClick={() => setChoice(section, choice.id)}
                />
              ))}
            </div>
          </div>
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
  const [choices, setChoices] = useState(() => choicesFromGrants(STAFF_PRESETS[0].grants));
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
        permissions: permissionsFromChoices(choices),
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
      setChoices(choicesFromGrants(STAFF_PRESETS[0].grants));
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
      <PermissionPicker choices={choices} onChange={setChoices} namePrefix="nowy" />
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
  const [choices, setChoices] = useState(() => choicesFromGrants(member.grants));
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
            member.grants.map((grant) => (
              <span key={grant.section} className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                {permissionChip(grant.section, grant.level)}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`name-${member.id}`}>Imię i nazwisko</Label>
        <Input id={`name-${member.id}`} value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-12" />
      </div>
      <PermissionPicker choices={choices} onChange={setChoices} namePrefix={member.id} />
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
              permissions: permissionsFromChoices(choices),
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
