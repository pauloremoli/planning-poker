import { splitLinks } from "../utils/linkify";

/** Renders text with any http(s) URLs turned into clickable links. */
export default function Linkify({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((segment, i) =>
        segment.type === "link" ? (
          <a key={i} href={segment.value} target="_blank" rel="noopener noreferrer">
            {segment.value}
          </a>
        ) : (
          segment.value
        )
      )}
    </>
  );
}
