import { Context } from 'https://deno.land/x/oak/mod.ts';

export const helpPageMiddlewere = async (ctx: Context) => {
    if (ctx.request.url.pathname === '/') {
        await ctx.send({
            root: './help-pages',
            index: 'index',
            path: '/',
        })
    }
    if (ctx.request.url.pathname.startsWith('/help')) {
        console.log('sending', '/' + ctx.request.url.pathname.replace(/^\/help\/?/, ''));
        await ctx.send({
            root: './help-pages',
            index: 'index',
            path: '/' + ctx.request.url.pathname.replace(/^\/help\/?/, '')
        })
    }
} 