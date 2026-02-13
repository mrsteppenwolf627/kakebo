import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPost {
    slug: string;
    frontmatter: {
        title: string;
        date: string;
        excerpt: string;
        author: string;
        readingTime?: string;
        image?: string;
    };
    content: string;
}

export function getBlogPosts(): BlogPost[] {
    if (!fs.existsSync(contentDirectory)) {
        return [];
    }

    const files = fs.readdirSync(contentDirectory);

    const posts = files
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => {
            const slug = file.replace('.mdx', '');
            const filePath = path.join(contentDirectory, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContent);

            return {
                slug,
                frontmatter: data as BlogPost['frontmatter'],
                content,
            };
        })
        .sort((a, b) => {
            return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
        });

    return posts;
}

export function getBlogPost(slug: string): BlogPost | null {
    const filePath = path.join(contentDirectory, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    return {
        slug,
        frontmatter: data as BlogPost['frontmatter'],
        content,
    };
}

export function getAllBlogSlugs() {
    if (!fs.existsSync(contentDirectory)) {
        return [];
    }
    const files = fs.readdirSync(contentDirectory);
    return files.map((file) => file.replace('.mdx', ''));
}
