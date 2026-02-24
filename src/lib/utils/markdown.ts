import MarkdownIt from 'markdown-it-ts';

const md = new MarkdownIt({
	html: false,
	breaks: true,
	linkify: true
});

export function renderMarkdown(content: string): string {
	return md.render(content);
}
