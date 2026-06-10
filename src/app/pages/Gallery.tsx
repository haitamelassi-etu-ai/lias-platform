import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Camera, Images } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ApiError, listGalleryItems, type GalleryItem } from "../lib/api";

const fallbackItems: Array<{
  key: string;
  title: string;
  caption: string | null;
  category: string | null;
  image_url: string;
}> = [
  {
    key: "fallback-1",
    title: "Conférences et rencontres scientifiques",
    category: "Conférences",
    caption: null,
    image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "fallback-2",
    title: "Recherche en intelligence artificielle",
    category: "Recherche",
    caption: null,
    image_url:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "fallback-3",
    title: "Systèmes connectés et IoT",
    category: "IoT",
    caption: null,
    image_url:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
  {
    key: "fallback-4",
    title: "Formation doctorale et innovation",
    category: "Doctorat",
    caption: null,
    image_url:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80",
  },
];

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listGalleryItems();
        setItems(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger la galerie");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchItems();
  }, []);

  const displayed =
    items.length > 0
      ? items.map((item) => ({
          key: String(item.id),
          title: item.title,
          caption: item.caption,
          category: item.category ?? "Média LIAS",
          image_url: item.image_url,
        }))
      : fallbackItems;

  return (
    <div>
      <div className="mb-12 max-w-4xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Médias
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Galerie photos et médias
        </h1>
        <p className="mt-5 text-xl text-text-secondary font-serif leading-relaxed">
          Un espace de valorisation visuelle pour les conférences, journées scientifiques,
          activités doctorales et projets du laboratoire.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Galerie dynamique indisponible. Affichage des visuels de démonstration.
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">
          Chargement de la galerie...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayed.map((item, index) => (
            <motion.article
              key={item.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="group bg-white border border-brand-primary/10 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <ImageWithFallback
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/30" />
                <Camera className="absolute left-5 top-5 text-white" size={28} />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-brand-secondary font-bold mb-2">
                  <Images size={18} /> {item.category}
                </div>
                <h2 className="text-xl font-bold text-brand-primary">{item.title}</h2>
                {item.caption && (
                  <p className="mt-2 text-sm text-text-secondary font-serif leading-relaxed">
                    {item.caption}
                  </p>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
