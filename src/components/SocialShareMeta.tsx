import { Helmet } from "react-helmet-async";

interface SocialShareMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "video.movie" | "video.tv_show";
}

export const SocialShareMeta = ({
  title,
  description,
  image,
  url = window.location.href,
  type = "website"
}: SocialShareMetaProps) => {
  const siteName = "Your Streaming Site"; // Replace with your site name
  const defaultImage = `${window.location.origin}/logo.png`; // Fallback image

  return (
    <Helmet>
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* WhatsApp */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* General Meta */}
      <meta name="description" content={description} />
      <link rel="canonical" content={url} />
    </Helmet>
  );
};
