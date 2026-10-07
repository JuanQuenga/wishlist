"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Gift as GiftIcon, Heart, Link2, LoaderCircle, Pencil, Plus, Share2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import type { Gift, GiftInput, WishlistViewProps } from "@/lib/wishlist";

type Filter = "all" | "available" | "reserved";
type Modal = { kind: "add" } | { kind: "edit"; gift: Gift } | { kind: "reserve"; gift: Gift } | { kind: "delete"; gift: Gift };
type Notice = { kind: "success" | "error"; text: string } | null;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function CircuitBoard({ gifts, ownedReservationIds }: { gifts: Gift[]; ownedReservationIds: string[] }) {
  const open = gifts.filter((gift) => !gift.reserved).length;
  const summary = gifts.length === 0 ? "Gift ideas are on the way." : open === gifts.length ? `${gifts.length} ${gifts.length === 1 ? "idea" : "ideas"}, all still available` : `${open} of ${gifts.length} still available`;
  return <div className="board">
    <span className="board-hole board-hole-tl" /><span className="board-hole board-hole-tr" /><span className="board-hole board-hole-bl" /><span className="board-hole board-hole-br" />
    <div className="board-copy">
      <h1 id="wishlist-title" className="board-title">A few things I&apos;d love.</h1>
      <p className="board-intro">Birthday and Christmas ideas, mostly things I can build with. If you pick one, reserve it here so nobody buys the same gift twice.</p>
    </div>
    <div className="board-legend"><p>{summary}</p><span><span className="led" />Available</span><span><span className="led led-reserved" />Reserved</span></div>
    {gifts.length > 0 && <ol className="board-bus" aria-label="Jump to a gift">
      {gifts.map((gift, index) => <li key={gift.id} className="part" style={{ "--i": index } as CSSProperties}>
        <a className="part-link" href={`#gift-${gift.id}`}>
          <span className="part-package">
            {gift.imageUrl ? <Image src={gift.imageUrl} alt="" fill sizes="120px" unoptimized /> : <GiftIcon size={34} strokeWidth={1.3} />}
            <span className={`led part-led ${gift.reserved ? "led-reserved" : ""}`} />
          </span>
          <span className="part-label"><span className="part-ref">U{index + 1}</span>{gift.title}</span>
          <span className="sr-only">{ownedReservationIds.includes(gift.id) ? ", reserved by you" : gift.reserved ? ", reserved" : ", available"}</span>
        </a>
      </li>)}
    </ol>}
    <span className="board-rev" aria-hidden="true">rev 2026</span>
  </div>;
}

function Dialog({ title, children, onClose, busy }: { title: string; children: ReactNode; onClose: () => void; busy: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previouslyFocused = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);
  return <dialog ref={ref} className="wishlist-dialog" aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="dialog-inner">
      <div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={21} /></button></div>
      {children}
    </div>
  </dialog>;
}

function GiftForm({ gift, busy, onSave, onClose }: { gift?: Gift; busy: boolean; onSave: (input: GiftInput) => Promise<void>; onClose: () => void }) {
  const [validationError, setValidationError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => { const value = data.get(name); return typeof value === "string" ? value.trim() : ""; };
    const url = field("url");
    const imageUrl = field("imageUrl");
    const validUrl = (value: string) => { try { const parsed = new URL(value); return parsed.protocol === "https:" || parsed.protocol === "http:"; } catch { return false; } };
    if (!validUrl(url)) { setValidationError("Add a full shop link starting with https:// or http://."); return; }
    if (imageUrl && !imageUrl.startsWith("/") && !validUrl(imageUrl)) { setValidationError("Use a full image link or a path starting with /."); return; }
    const accentValue = field("accent");
    const accent = accentValue === "mint" || accentValue === "rose" ? accentValue : "lavender";
    setValidationError("");
    await onSave({ title: field("title"), brand: field("brand"), description: field("description"), url, imageUrl, price: field("price"), priceNote: field("priceNote"), category: field("category"), accent });
  }
  return <form className="gift-form" onSubmit={submit}>
    <label>Gift name<input name="title" required maxLength={120} defaultValue={gift?.title} placeholder="What would you love?" autoFocus /></label>
    <div className="form-row"><label>Brand or shop<input name="brand" required maxLength={100} defaultValue={gift?.brand} placeholder="e.g. Seeed Studio" /></label><label>Category<input name="category" required maxLength={80} defaultValue={gift?.category ?? "Tech & tinkering"} /></label></div>
    <label>Why it&apos;s on the list<textarea name="description" required maxLength={1200} rows={3} defaultValue={gift?.description} placeholder="A little context for family and friends." /></label>
    <label>Shop link<input name="url" type="url" required maxLength={2048} defaultValue={gift?.url} placeholder="https://" /></label>
    <label>Image link <span className="optional">Optional</span><input name="imageUrl" maxLength={2048} defaultValue={gift?.imageUrl} placeholder="https://" /></label>
    <div className="form-row"><label>Price <span className="optional">Optional</span><input name="price" maxLength={80} defaultValue={gift?.price} placeholder="$49.99" /></label><label>Price note <span className="optional">Optional</span><input name="priceNote" maxLength={300} defaultValue={gift?.priceNote} placeholder="Before shipping" /></label></div>
    <label>Photo background<select name="accent" defaultValue={gift?.accent ?? "lavender"}><option value="mint">Green</option><option value="lavender">Blue</option><option value="rose">Gold</option></select></label>
    {validationError && <p className="form-error" role="alert">{validationError}</p>}
    <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy && <LoaderCircle className="spinner" size={18} />}{gift ? "Save changes" : "Add gift"}</button></div>
  </form>;
}

function GiftCard({ gift, isOwner, owned, busy, processing, sharingReady, onReserve, onRelease, onEdit, onDelete }: { gift: Gift; isOwner: boolean; owned: boolean; busy: boolean; processing: boolean; sharingReady: boolean; onReserve: () => void; onRelease: () => void; onEdit: () => void; onDelete: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <article className="gift" id={`gift-${gift.id}`} aria-labelledby={`gift-title-${gift.id}`}>
    <div className={`gift-photo gift-photo-${gift.accent}`}>
      <span className={`gift-status ${gift.reserved ? "gift-status-reserved" : ""}`}><span className={`led ${gift.reserved ? "led-reserved" : ""}`} />{owned ? "Reserved by you" : gift.reserved ? "Reserved" : "Available"}</span>
      {gift.imageUrl && !imageFailed ? <Image src={gift.imageUrl} alt={gift.title} fill sizes="(max-width: 760px) 100vw, 420px" unoptimized onError={() => setImageFailed(true)} /> : <div className="gift-photo-fallback"><GiftIcon size={64} strokeWidth={1.2} /><span>{gift.brand}</span></div>}
      {isOwner && <div className="gift-owner-tools"><button type="button" className="icon-button" aria-label={`Edit ${gift.title}`} onClick={onEdit} disabled={busy || !sharingReady}><Pencil size={17} /></button><button type="button" className="icon-button" aria-label={`Delete ${gift.title}`} onClick={onDelete} disabled={busy || !sharingReady}><Trash2 size={17} /></button></div>}
    </div>
    <div className="gift-body">
      <p className="gift-brand">{gift.brand}</p>
      <h3 id={`gift-title-${gift.id}`} className="gift-title">{gift.title}</h3>
      <p className="gift-description">{gift.description}</p>
      <dl className="gift-specs">
        <div><dt>Price</dt><dd><span className="gift-price">{gift.price || "See the store"}</span>{gift.priceNote && <span className="gift-price-note">{gift.priceNote}</span>}</dd></div>
        <div><dt>Category</dt><dd>{gift.category}</dd></div>
      </dl>
      <div className="gift-actions">
        {owned ? <button type="button" className="button button-secondary" onClick={onRelease} disabled={busy || !sharingReady}>{processing ? <LoaderCircle size={18} className="spinner" /> : <Check size={18} />}Release reservation</button> : <button type="button" className={`button ${gift.reserved ? "button-reserved" : "button-primary"}`} disabled={gift.reserved || busy || !sharingReady} onClick={onReserve}>{processing ? <LoaderCircle size={18} className="spinner" /> : gift.reserved ? <Check size={18} /> : <GiftIcon size={18} />}{gift.reserved ? "Already reserved" : "Reserve this gift"}</button>}
        <a className="button button-secondary" href={gift.url} target="_blank" rel="noopener noreferrer">View at store<ArrowUpRight size={18} /><span className="sr-only">(opens in a new tab)</span></a>
      </div>
    </div>
  </article>;
}

export function WishlistView(props: WishlistViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<Modal | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [shareLabel, setShareLabel] = useState("Share wishlist");
  const { gifts, loading, sharingReady, isOwner, ownedReservationIds } = props;
  const availableCount = gifts.filter((gift) => !gift.reserved).length;
  const filteredGifts = gifts.filter((gift) => filter === "all" || (filter === "reserved" ? gift.reserved : !gift.reserved));

  async function perform(key: string, action: () => Promise<void>, success: string) {
    setPending(key); setNotice(null);
    try { await action(); setNotice({ kind: "success", text: success }); setModal(null); }
    catch (error) { setNotice({ kind: "error", text: errorMessage(error) }); }
    finally { setPending(null); }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia("(max-width: 700px)").matches) await navigator.share({ title: "Juan's wishlist", text: "A few things I'd love for my birthday or Christmas.", url });
      else { await navigator.clipboard.writeText(url); setShareLabel("Link copied"); setNotice({ kind: "success", text: "Wishlist link copied. Send it to family or friends." }); }
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNotice({ kind: "error", text: "Could not copy the link. Copy the address from your browser to share it." }); }
  }

  return <div className="wishlist-page">
    <header className="site-header page-width">
      <Link className="wordmark" href="/" aria-label="Juan's wishlist home"><span className="wordmark-icon"><GiftIcon size={20} strokeWidth={1.8} /></span><span>Juan&apos;s wishlist</span></Link>
      <nav className="header-actions" aria-label="Wishlist actions"><a className="account-link" href={props.accountHref}>{props.signedIn ? "Sign out" : "Owner sign in"}</a><button type="button" className="button button-share" aria-label={shareLabel} onClick={share}><Share2 size={17} /><span>{shareLabel}</span></button></nav>
    </header>

    <main>
      <section className="hero page-width" aria-labelledby="wishlist-title">
        <CircuitBoard gifts={gifts} ownedReservationIds={ownedReservationIds} />
      </section>

      <section className="wishlist-section page-width" aria-labelledby="gifts-heading">
        <div className="section-heading"><div><h2 id="gifts-heading">The list</h2><p>Reserve a gift first, then buy it from the store.</p></div>{isOwner && <button type="button" className="button button-primary" onClick={() => { setNotice(null); setModal({ kind: "add" }); }} disabled={!sharingReady || pending !== null}><Plus size={18} />Add a gift</button>}</div>
        <div className="list-toolbar"><div className="filter-group" role="group" aria-label="Filter gifts">{([{ value: "all", label: "All gifts", count: gifts.length }, { value: "available", label: "Available", count: availableCount }, { value: "reserved", label: "Reserved", count: gifts.length - availableCount }] satisfies { value: Filter; label: string; count: number }[]).map((item) => <button type="button" key={item.value} aria-pressed={filter === item.value} className={`filter-button ${filter === item.value ? "filter-active" : ""}`} onClick={() => setFilter(item.value)}>{item.label}<span>{item.count}</span></button>)}</div></div>

        {!sharingReady && <div className="development-notice"><Link2 size={19} /><div><strong>Reservations are being set up.</strong><p>You can still share this list and visit the stores.</p></div></div>}
        {props.signedIn && !isOwner && <p className="account-notice">This account can&apos;t edit Juan&apos;s wishlist. Family can still reserve gifts.</p>}
        {notice && !modal && <div className={`notice notice-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.kind === "success" && <Check size={18} />}<span>{notice.text}</span><button type="button" aria-label="Dismiss message" className="icon-button" onClick={() => setNotice(null)}><X size={17} /></button></div>}
        {loading ? <div className="loading-state" role="status"><LoaderCircle className="spinner" size={24} />Loading the wishlist...</div> : filteredGifts.length ? <div className="gift-list">{filteredGifts.map((gift) => <GiftCard key={`${gift.id}-${gift.imageUrl}`} gift={gift} isOwner={isOwner} owned={ownedReservationIds.includes(gift.id)} busy={pending !== null} processing={pending === gift.id} sharingReady={sharingReady} onReserve={() => { setNotice(null); setModal({ kind: "reserve", gift }); }} onRelease={() => void perform(gift.id, () => props.onRelease(gift.id), "Reservation released. This gift is available again.")} onEdit={() => { setNotice(null); setModal({ kind: "edit", gift }); }} onDelete={() => { setNotice(null); setModal({ kind: "delete", gift }); }} />)}</div> : <div className="empty-state"><h3>{filter === "reserved" ? "No gifts reserved yet." : filter === "available" ? "Every gift is reserved." : "A little room for inspiration."}</h3><p>{filter === "reserved" ? "Choose a gift and reserve it to avoid a duplicate." : filter === "available" ? "Thank you for making the list happen." : isOwner ? "Add the first thing you would love." : "Check back for gift ideas soon."}</p>{filter !== "all" && <button type="button" className="button button-secondary" onClick={() => setFilter("all")}>See all gifts</button>}</div>}
        <p className="list-footnote">Reservations help avoid duplicate gifts. You can release yours from this browser if plans change.</p>
      </section>
    </main>

    <footer className="site-footer page-width"><p>Thanks for thinking of me.<Heart size={16} /></p><span>Juan&apos;s birthday and Christmas wishlist</span></footer>

    {modal && <Dialog title={modal.kind === "add" ? "Add a gift" : modal.kind === "edit" ? "Edit gift" : modal.kind === "delete" ? "Remove this gift?" : "Reserve this gift?"} busy={pending !== null} onClose={() => { setModal(null); setNotice(null); }}>
      {notice?.kind === "error" && <p className="form-error" role="alert">{notice.text}</p>}
      {modal.kind === "add" || modal.kind === "edit" ? <GiftForm gift={modal.kind === "edit" ? modal.gift : undefined} busy={pending !== null} onClose={() => setModal(null)} onSave={(input) => perform(modal.kind === "edit" ? modal.gift.id : "add", () => modal.kind === "edit" ? props.onEdit(modal.gift.id, input) : props.onAdd(input), modal.kind === "edit" ? "Gift updated." : "Gift added to the wishlist.")} /> : <>
        <p className="dialog-gift-name">{modal.gift.title}</p>
        <p className="dialog-description">{modal.kind === "reserve" ? "Mark this gift as reserved so someone else doesn't buy the same thing. Then follow the shop link to purchase it. You can release your reservation from this browser." : "This removes the gift and any reservation from your wishlist."}</p>
        <div className="dialog-actions"><button type="button" className="button button-secondary" disabled={pending !== null} onClick={() => setModal(null)}>Cancel</button><button type="button" className={`button ${modal.kind === "delete" ? "button-danger" : "button-primary"}`} disabled={pending !== null} onClick={() => void perform(modal.gift.id, () => modal.kind === "delete" ? props.onDelete(modal.gift.id) : props.onReserve(modal.gift.id), modal.kind === "delete" ? "Gift removed." : "Gift reserved. Follow the shop link to purchase it.")}>{pending !== null && <LoaderCircle size={18} className="spinner" />}{modal.kind === "delete" ? "Remove gift" : "Reserve this gift"}</button></div>
      </>}
    </Dialog>}
  </div>;
}
