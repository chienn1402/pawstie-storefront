import {redirect} from 'react-router';
import type {Route} from './+types/collections.all';

// The branded catalog lives at /shop now. Keep Shopify's conventional
// "all products" URL working with a permanent redirect.
export async function loader(_args: Route.LoaderArgs) {
  throw redirect('/shop', 301);
}
