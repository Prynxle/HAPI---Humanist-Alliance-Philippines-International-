import { WorksWheel } from "@/components/ui/works-wheel";
import { Brand } from "@/components/site-nav";
import { presenterWorks } from "@/data/presenters";
import { presenterBioImages } from "@/data/presenter-bio-images";

export default function AbstractPresentersPage() {
  return (
    <main className="abstract-presenters-page">
      <div className="abstract-presenters-brand"><Brand /></div>
      <WorksWheel
        items={presenterWorks}
        lightboxImages={presenterBioImages}
        label="Presenters"
        labelKicker="HAPI"
        action="View biography"
        className="min-h-0"
      />
    </main>
  );
}
