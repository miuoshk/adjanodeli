"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ActiveSwitch } from "@/components/admin/active-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { slugifyName } from "@/lib/admin/catalog";
import {
  createAllergen,
  createProductTag,
  deleteAllergen,
  deleteProductTag,
  updateAllergen,
  updateProductTag,
} from "@/lib/admin/owner-actions";
import type { OwnerAllergen, OwnerProductTag } from "@/lib/admin/owner-queries";

const TAG_COLORS = [
  { value: "gold", label: "złoty" },
  { value: "khaki", label: "khaki" },
  { value: "red", label: "czerwony" },
] as const;

type DictionariesManagerProps = {
  allergens: OwnerAllergen[];
  tags: OwnerProductTag[];
};

export function DictionariesManager({ allergens, tags }: DictionariesManagerProps) {
  return (
    <Tabs defaultValue="allergens">
      <TabsList className="h-12">
        <TabsTrigger className="min-h-10 px-4 text-base" value="allergens">
          Alergeny
        </TabsTrigger>
        <TabsTrigger className="min-h-10 px-4 text-base" value="tags">
          Tagi
        </TabsTrigger>
      </TabsList>
      <TabsContent value="allergens" className="mt-4">
        <AllergenList items={allergens} />
      </TabsContent>
      <TabsContent value="tags" className="mt-4">
        <TagList items={tags} />
      </TabsContent>
    </Tabs>
  );
}

function AllergenList({ items }: { items: OwnerAllergen[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(String((items.at(-1)?.sort_order ?? 0) + 1));
  const [adding, setAdding] = useState(false);

  async function add() {
    setAdding(true);
    try {
      const result = await createAllergen(name, Number(sortOrder));
      if (!result.ok) {
        toast(result.message);
        return;
      }
      setName("");
      toast("Alergen dodany.");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <label className="flex-1 space-y-1 text-sm">
          <span>Nowa nazwa</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <label className="w-28 space-y-1 text-sm">
          <span>Kolejność</span>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <Button type="submit" className="min-h-12" disabled={adding}>
          Dodaj
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze alergenów.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <AllergenRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AllergenRow({ item }: { item: OwnerAllergen }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [sortOrder, setSortOrder] = useState(String(item.sort_order));
  const [isActive, setIsActive] = useState(item.is_active);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await updateAllergen(item.id, {
        name,
        sortOrder: Number(sortOrder),
        isActive,
      });
      if (!result.ok) {
        toast(result.message);
        return;
      }
      toast("Zapisane.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const result = await deleteAllergen(item.id);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      toast(result.deactivated ? "W użyciu — wyłączony." : "Usunięty.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[5rem_1fr_auto]">
        <label className="space-y-1 text-sm">
          <span>Kolejność</span>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Nazwa</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <div className="flex items-end">
          <ActiveSwitch
            checked={isActive}
            disabled={saving}
            onCheckedChange={setIsActive}
            label="Aktywny"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {item.productCount === 0 ? "Nie używany w produktach." : `W ${item.productCount} produktach.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-12" disabled={saving} onClick={() => void save()}>
          Zapisz
        </Button>
        <Button type="button" variant="outline" className="min-h-12" disabled={saving} onClick={() => void remove()}>
          Usuń
        </Button>
      </div>
    </li>
  );
}

function TagList({ items }: { items: OwnerProductTag[] }) {
  const router = useRouter();
  const slugTouched = useRef(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("gold");
  const [sortOrder, setSortOrder] = useState(String((items.at(-1)?.sort_order ?? 0) + 1));
  const [adding, setAdding] = useState(false);

  async function add() {
    setAdding(true);
    try {
      const result = await createProductTag({
        name,
        slug,
        color,
        sortOrder: Number(sortOrder),
      });
      if (!result.ok) {
        toast(result.message);
        return;
      }
      setName("");
      setSlug("");
      slugTouched.current = false;
      toast("Tag dodany.");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="grid gap-2 sm:grid-cols-[1fr_8rem_7rem_6rem_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <label className="space-y-1 text-sm">
          <span>Nowa nazwa</span>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched.current) {
                setSlug(slugifyName(event.target.value));
              }
            }}
            className="min-h-12 text-base"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Slug</span>
          <Input
            value={slug}
            onChange={(event) => {
              slugTouched.current = true;
              setSlug(event.target.value.toLowerCase());
            }}
            className="min-h-12 font-mono text-base"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Kolor</span>
          <select
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
          >
            {TAG_COLORS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Kolejność</span>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <Button type="submit" className="min-h-12" disabled={adding}>
          Dodaj
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nie ma jeszcze tagów.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <TagRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TagRow({ item }: { item: OwnerProductTag }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug);
  const [color, setColor] = useState(item.color);
  const [sortOrder, setSortOrder] = useState(String(item.sort_order));
  const [isActive, setIsActive] = useState(item.is_active);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await updateProductTag(item.id, {
        name,
        slug,
        color,
        sortOrder: Number(sortOrder),
        isActive,
      });
      if (!result.ok) {
        toast(result.message);
        return;
      }
      toast("Zapisane.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      const result = await deleteProductTag(item.id);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      toast(result.deactivated ? "W użyciu — wyłączony." : "Usunięty.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="space-y-3 rounded-xl border border-[var(--adj-cream-dark)] bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[5rem_1fr_8rem_7rem_auto]">
        <label className="space-y-1 text-sm">
          <span>Kolejność</span>
          <Input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Nazwa</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 text-base"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Slug</span>
          <Input
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            className="min-h-12 font-mono text-base"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Kolor</span>
          <select
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base"
          >
            {TAG_COLORS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <ActiveSwitch
            checked={isActive}
            disabled={saving}
            onCheckedChange={setIsActive}
            label="Aktywny"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {item.productCount === 0 ? "Nie używany w produktach." : `W ${item.productCount} produktach.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-12" disabled={saving} onClick={() => void save()}>
          Zapisz
        </Button>
        <Button type="button" variant="outline" className="min-h-12" disabled={saving} onClick={() => void remove()}>
          Usuń
        </Button>
      </div>
    </li>
  );
}
