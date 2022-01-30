import { Application, Router, Context } from 'https://deno.land/x/oak/mod.ts';
import { helpPageMiddlewere } from './help.ts';

interface Item {
    name: string,
    count: number,
    data: Record<string, unknown>,
}

interface User {
    name: string,
    inventory: Item[],
    location: {
        x: number,
        y: number,
    },
    balance: number,
}

interface Trade {
    from: string,
    to: string,
    offer: Item,
    for: number,
}

const randStr = (s: number) => {
    const buf = new Uint8Array(s);
    crypto.getRandomValues(buf);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let ret = "";
    for (let i = 0; i < buf.length; ++i) {
        const ind = Math.floor((buf[i] / 256) * alphabet.length)
        ret += alphabet[ind]
    }
    return ret;
}

const newUser = () => ({
    name: `anonymous-${randStr(12)}`,
    inventory: [],
    location: {
        x: 0,
        y: 0,
    },
    balance: 0,
})

const generateChunk = () => {
    const chunk = [];
    for (let y = 0; y < 100; y += 1) {
        const row = []
        for (let x = 0; x < 100; x += 1) {
            row.push(y % 2 === 0 ? '0' : '1');
        }
        chunk.push(row);
    }
    return chunk;
}

const getChunkIndFromLoc = ({ x, y }: { x: number, y: number }) => {
    const cx = Math.floor(x / 100);
    const cy = Math.floor(y / 100);
    return { x: cx, y: cy };
}

const getTile = ({ x, y }: { x: number, y: number }) => {
    const cloc = getChunkIndFromLoc({ x, y });
    const coffx = x > 0 ? x % 100 : 99 - -(x % 100);
    const coffy = y > 0 ? y % 100 : 99 - -(y % 100);
    if (!data.chunks[`${cloc.x},${cloc.y}`]) {
        data.chunks[`${cloc.x},${cloc.y}`] = generateChunk()
    }
    const chunk = data.chunks[`${cloc.x},${cloc.y}`];
    if (chunk[coffy] === undefined) {
        console.log(coffy)
    }
    return chunk[coffy][coffx];
}

const dataFile = Deno.args[0];

let data: {
    users: { [key: string]: User },
    trades: { [id: string]: Trade },
    chunks: { [pos: string]: string[][] }
} = {
    users: {},
    trades: {},
    chunks: {},
};

try {
    data = JSON.parse(Deno.readTextFileSync(dataFile))
    data.chunks = data.chunks ?? {};
    data.trades = data.trades ?? {};
    data.users = data.users ?? {};
} catch (_) {
    console.log('Unable to open users file: Using empty object');
}

setInterval(() => {
    Deno.writeTextFileSync(dataFile, JSON.stringify(data));
}, 1000)

const app = new Application();

const router = new Router();

const getKey = (ctx: Context): string | undefined => {
    const key = ctx.request.url.searchParams.get('k');
    if (!key) {
        ctx.response.body = 'Not authenticated: provide a key (can be anything!) with ?k=[key] like /example/action/?k=[key]\n';
        return undefined;
    }

    if (data.users[key] === undefined) {
        data.users[key] = newUser();
    }

    return key;
}

router.get('/world/location', (ctx) => {
    const key = getKey(ctx);
    if (key) {
        ctx.response.body = `${data.users[key].location.x}, ${data.users[key].location.y}\n`
    }
})

router.get('/world/walk/north', (ctx) => {
    const key = getKey(ctx);
    if (key) {
        data.users[key].location.y += 1;

        ctx.response.body = `success! New location: ${data.users[key].location.x}, ${data.users[key].location.y}\n`
    }
})

router.get('/world/walk/south', (ctx) => {
    const key = getKey(ctx);
    if (key) {
        data.users[key].location.y -= 1;

        ctx.response.body = `success! New location: ${data.users[key].location.x}, ${data.users[key].location.y}\n`
    }
})

router.get('/world/walk/east', (ctx) => {
    const key = getKey(ctx);
    if (key) {
        data.users[key].location.x += 1;

        ctx.response.body = `success! New location: ${data.users[key].location.x}, ${data.users[key].location.y}\n`
    }
})

router.get('/world/walk/west', (ctx) => {
    const key = getKey(ctx);
    if (key) {
        data.users[key].location.x -= 1;

        ctx.response.body = `success! New location: ${data.users[key].location.x}, ${data.users[key].location.y}\n`
    }
})

router.get('/world/map', (ctx) => {
    const key = getKey(ctx);
    if (key) {
        const { x: ux, y: uy } = data.users[key].location;
        let res = '';
        for (let y = uy - 12; y <= uy + 12; y++) {
            let row = '';
            for (let x = ux - 12; x <= ux + 12; x++) {
                row += getTile({ x, y });
            }
            res += row + '\n';
        }

        ctx.response.body = res;
    }
})


app.use(router.routes())
app.use(router.allowedMethods())
app.use(helpPageMiddlewere);

await app.listen({ port: 8081 })