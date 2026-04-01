"use client";

import { useEffect, useState } from "react";

import { getBlogPostBySlug, type BlogPostRecord } from "@/lib/phase6";

export default function BlogPostPage({ params }: { params: { uid: string; slug: string } }) {
  const [post, setPost] = useState<BlogPostRecord | null>(null);

  useEffect(() => {
    void getBlogPostBySlug(params.uid, params.slug).then(setPost);
  }, [params.slug, params.uid]);

  if (!post) {
    return <div className="mx-auto max-w-3xl py-10">Article not found.</div>;
  }

  return (
    <article className="mx-auto max-w-3xl py-10">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{post.summary}</p>
      <div className="mt-8 whitespace-pre-wrap text-sm leading-7">{post.body}</div>
    </article>
  );
}
