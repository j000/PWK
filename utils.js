// random int between min and max, inclusive
export function getRandomInt(min, max)
{
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getRandom(min = 0., max = 1.)
{
	return Math.random() * (max - min) + min;
}

export function getNormal(mean = 0.5, deviation = 0.5)
{
	var u = 0, v = 0;
	do {
		u = Math.random();
	} while (u == 0);
	do {
		v = Math.random();
	} while (v == 0);
	return mean
		+ deviation * Math.sqrt(-2.0 * Math.log(u))
		* Math.cos(2.0 * Math.PI * v);
}

export function getNormalInRange(min = 0., max = 1.)
{
	var out;
	do {
		out = getNormal((min + max) / 2, (max - min) / 4);
	} while (out < min || out > max);
	return out;
}
