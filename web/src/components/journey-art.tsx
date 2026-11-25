import { ArrowUpRight, BusFront, Check, MapPin } from "lucide-react";

/** Decorative product illustration, never presented as a real booking. */
export function JourneyArt() {
  return (
    <div className="journey-art" aria-hidden="true">
      <div className="art-halo" />
      <div className="art-landscape">
        <svg viewBox="0 0 480 320" fill="none">
          <path d="M-50 260C100 50 210 430 530 70" stroke="white" strokeOpacity=".35" strokeWidth="90" />
          <path d="M-50 260C100 50 210 430 530 70" stroke="white" strokeOpacity=".8" strokeWidth="2" strokeDasharray="8 12" />
          <circle cx="115" cy="200" r="14" fill="white" fillOpacity=".6" />
          <circle cx="115" cy="200" r="6" fill="#0071e3" />
          <circle cx="375" cy="190" r="14" fill="white" fillOpacity=".6" />
          <circle cx="375" cy="190" r="6" fill="#0071e3" />
        </svg>
      </div>
      <div className="art-ticket">
        <div className="art-ticket-top"><span><BusFront size={17} /> wayfare</span><ArrowUpRight size={18} /></div>
        <span className="art-ticket-label">A little closer to</span>
        <strong>Your next<br />great day.</strong>
        <div className="art-ticket-bottom"><span><MapPin size={14} /> Your seat. Your journey.</span><span className="art-check"><Check size={15} /></span></div>
      </div>
      <span className="art-floating-label"><Check size={14} /> Less planning. More living.</span>
    </div>
  );
}
