/*! 🌼 daisyUI 5.5.19 */
import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	throw redirect(307, `/accounts/${params.username}`);
}
