"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCreatorBlogPosts, type BlogPostRecord } from "@/lib/phase6";

export default function CreatorBlogPage({ params }: { params: { uid: string } }) {
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);

  useEffect(() => {
    void getCreatorBlogPosts(params.uid).then(setPosts);
  }, [params.uid]);

  return (
    <div className="mx-auto max-w-4xl py-10">
      <h1 className="text-3xl font-bold">Creator Blog</h1>
      <div className="mt-6 space-y-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${params.uid}/${post.slug}`} className="block rounded-xl border p-5 hover:bg-muted/40">
            <p className="text-xl font-semibold">{post.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{post.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
