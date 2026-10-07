"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Gift as GiftIcon, Heart, Link2, LoaderCircle, Pencil, Plus, Share2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Gift, GiftInput, WishlistViewProps } from "@/lib/wishlist";

type Filter = "all" | "available" | "reserved";
type Modal = { kind: "add" } | { kind: "edit"; gift: Gift } | { kind: "reserve"; gift: Gift } | { kind: "delete"; gift: Gift };
type Notice = { kind: "success" | "error"; text: string } | null;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function GiftDoodle() {
  return <svg className="gift-doodle" viewBox="0 0 330 310" fill="none" aria-hidden="true">
    <path d="M48 252c61 19 180 22 234-4" stroke="#E4DCEF" strokeWidth="14" strokeLinecap="round" />
    <g transform="rotate(-7 160 164)">
      <path d="M71 130h191v126c-54 8-123 6-191-1V130Z" fill="#E7F4EC" stroke="#482D66" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M65 105c52-5 130-5 203 0v38c-62 4-132 4-203 0v-38Z" fill="#FFD66B" stroke="#482D66" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M152 105h30v154h-30V105Z" fill="#7254C4" stroke="#482D66" strokeWidth="3.5" />
      <path d="M168 105c-31-4-66-15-61-43 4-23 45-9 61 43Z" fill="#CDBDF0" stroke="#482D66" strokeWidth="3.5" />
      <path d="M168 105c29-4 59-23 49-45-11-24-38-1-49 45Z" fill="#CDBDF0" stroke="#482D66" strokeWidth="3.5" />
      <path d="m203 168 34-3 5 40-34 3-5-40Z" fill="#FFE5E8" stroke="#482D66" strokeWidth="3" strokeLinejoin="round" />
      <path d="m210 177 23-10" stroke="#482D66" strokeWidth="2" strokeLinecap="round" />
      <path d="m216 185 11 9 8-12" stroke="#7254C4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="m51 62 4-14m-12 7 16 2M278 85l7-10m-13 0 14 10M43 181l-11-4m10-8-3 18" stroke="#7254C4" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M263 39c10-10 20-2 12 7l-13 12-9-15c-6-12 6-16 10-4Z" fill="#FFE5E8" stroke="#482D66" strokeWidth="2.5" />
  </svg>;
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
    <label>Background color<select name="accent" defaultValue={gift?.accent ?? "lavender"}><option value="lavender">Lilac</option><option value="mint">Mint</option><option value="rose">Blush</option></select></label>
    {validationError && <p className="form-error" role="alert">{validationError}</p>}
    <div className="dialog-actions"><button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy && <LoaderCircle className="spinner" size={18} />}{gift ? "Save changes" : "Add gift"}</button></div>
  </form>;
}

function GiftCard({ gift, isOwner, owned, busy, processing, sharingReady, onReserve, onRelease, onEdit, onDelete }: { gift: Gift; isOwner: boolean; owned: boolean; busy: boolean; processing: boolean; sharingReady: boolean; onReserve: () => void; onRelease: () => void; onEdit: () => void; onDelete: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <article className="gift-card">
    <div className={`gift-image gift-image-${gift.accent}`}>
      <span className={`availability ${gift.reserved ? "availability-reserved" : ""}`}>{gift.reserved ? <Check size={14} /> : <span className="available-dot" />}{owned ? "Reserved by you" : gift.reserved ? "Reserved" : "Available"}</span>
      {gift.imageUrl && !imageFailed ? <Image src={gift.imageUrl} alt={gift.title} fill sizes="(max-width: 700px) 100vw, (max-width: 1160px) 50vw, 520px" unoptimized onError={() => setImageFailed(true)} /> : <div className="gift-image-fallback"><GiftIcon size={76} strokeWidth={1.2} /><span>{gift.brand}</span></div>}
      {isOwner && <div className="gift-owner-tools"><button type="button" className="icon-button" aria-label={`Edit ${gift.title}`} onClick={onEdit} disabled={busy || !sharingReady}><Pencil size={17} /></button><button type="button" className="icon-button" aria-label={`Delete ${gift.title}`} onClick={onDelete} disabled={busy || !sharingReady}><Trash2 size={17} /></button></div>}
    </div>
    <div className="gift-card-body">
      <div className="gift-meta"><span>{gift.brand}</span><span className="category">{gift.category}</span></div>
      <h3>{gift.title}</h3>
      <p className="gift-description">{gift.description}</p>
      <div className="gift-price"><span>{gift.price || "See shop for price"}</span>{gift.priceNote && <span className="price-note">{gift.priceNote}</span>}</div>
      <div className="gift-actions">
        <a className="button button-secondary shop-button" href={gift.url} target="_blank" rel="noopener noreferrer">View at store<ArrowUpRight size={18} /></a>
        {owned ? <button type="button" className="button button-secondary release-button" onClick={onRelease} disabled={busy || !sharingReady}>{processing ? <LoaderCircle size={18} className="spinner" /> : <Check size={18} />}Release reservation</button> : <button type="button" className={`button ${gift.reserved ? "button-reserved" : "button-primary"}`} disabled={gift.reserved || busy || !sharingReady} onClick={onReserve}>{processing ? <LoaderCircle size={18} className="spinner" /> : gift.reserved ? <Check size={18} /> : <GiftIcon size={18} />}{gift.reserved ? "Already reserved" : "Reserve this gift"}</button>}
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
      <Link className="wordmark" href="/" aria-label="Juan's wishlist home"><span className="wordmark-icon"><GiftIcon size={22} strokeWidth={1.8} /></span><span>Juan&apos;s wishlist</span></Link>
      <nav className="header-actions" aria-label="Wishlist actions"><a className="account-link" href={props.accountHref}>{props.signedIn ? "Sign out" : "Owner sign in"}</a><button type="button" className="button button-share" aria-label={shareLabel} onClick={share}><Share2 size={17} /><span>{shareLabel}</span></button></nav>
    </header>

    <main>
      <section className="hero page-width" aria-labelledby="wishlist-title">
        <div className="hero-copy"><p className="occasion"><span className="occasion-dot" />For birthdays &amp; Christmas</p><h1 id="wishlist-title">A few things<br />I&apos;d love.</h1><p className="hero-description">Little ideas for the next celebration. If something catches your eye, reserve it so we don&apos;t double up.</p><div className="hero-signoff"><span className="signature">Juan</span><Heart size={19} strokeWidth={1.6} /></div></div>
        <div className="hero-art"><GiftDoodle /><span className="hero-art-caption">Good things come wrapped.</span></div>
      </section>

      <section className="wishlist-section page-width" aria-labelledby="gifts-heading">
        <div className="section-heading"><div><h2 id="gifts-heading">On my wishlist<span className="gift-count">{gifts.length}</span></h2><p>A couple of things for my next little project.</p></div>{isOwner && <button type="button" className="button button-primary" onClick={() => { setNotice(null); setModal({ kind: "add" }); }} disabled={!sharingReady || pending !== null}><Plus size={18} />Add a gift</button>}</div>
        <div className="list-toolbar"><div className="filter-group" role="group" aria-label="Filter gifts">{([{ value: "all", label: "All gifts", count: gifts.length }, { value: "available", label: "Available", count: availableCount }, { value: "reserved", label: "Reserved", count: gifts.length - availableCount }] satisfies { value: Filter; label: string; count: number }[]).map((item) => <button type="button" key={item.value} aria-pressed={filter === item.value} className={`filter-button ${filter === item.value ? "filter-active" : ""}`} onClick={() => setFilter(item.value)}>{item.label}<span>{item.count}</span></button>)}</div><span className="reservation-note"><Check size={15} />Reserve first, then shop</span></div>

        {!sharingReady && <div className="development-notice"><Link2 size={19} /><div><strong>Reservations are being set up.</strong><p>You can still share this list and visit the stores.</p></div></div>}
        {props.signedIn && !isOwner && <p className="account-notice">This account can&apos;t edit Juan&apos;s wishlist. Family can still reserve gifts.</p>}
        {notice && !modal && <div className={`notice notice-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.kind === "success" && <Check size={18} />}<span>{notice.text}</span><button type="button" aria-label="Dismiss message" className="icon-button" onClick={() => setNotice(null)}><X size={17} /></button></div>}
        {loading ? <div className="loading-state" role="status"><LoaderCircle className="spinner" size={24} />Loading the wishlist...</div> : filteredGifts.length ? <div className="gift-grid">{filteredGifts.map((gift) => <GiftCard key={`${gift.id}-${gift.imageUrl}`} gift={gift} isOwner={isOwner} owned={ownedReservationIds.includes(gift.id)} busy={pending !== null} processing={pending === gift.id} sharingReady={sharingReady} onReserve={() => { setNotice(null); setModal({ kind: "reserve", gift }); }} onRelease={() => void perform(gift.id, () => props.onRelease(gift.id), "Reservation released. This gift is available again.")} onEdit={() => { setNotice(null); setModal({ kind: "edit", gift }); }} onDelete={() => { setNotice(null); setModal({ kind: "delete", gift }); }} />)}</div> : <div className="empty-state"><GiftIcon size={36} strokeWidth={1.4} /><h3>{filter === "reserved" ? "No gifts reserved yet." : filter === "available" ? "Every gift is reserved." : "A little room for inspiration."}</h3><p>{filter === "reserved" ? "Choose a gift and reserve it to avoid a duplicate." : filter === "available" ? "Thank you for making the list happen." : isOwner ? "Add the first thing you would love." : "Check back for gift ideas soon."}</p>{filter !== "all" && <button type="button" className="button button-secondary" onClick={() => setFilter("all")}>See all gifts</button>}</div>}
        <p className="list-footnote">Reservations help avoid duplicate gifts. You can release yours from this browser if plans change.</p>
      </section>
    </main>

    <footer className="site-footer page-width"><p>Thanks for thinking of me.<Heart size={16} /></p><span>Juan&apos;s birthday &amp; Christmas wishlist</span></footer>

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
