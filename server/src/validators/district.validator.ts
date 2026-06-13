import { z } from 'zod';

const longitude = z.number().min(73.8).max(74.8);
const latitude = z.number().min(31.2).max(31.8);
const coordinate = z.tuple([longitude, latitude]);

const ringSchema = z.array(coordinate).min(4).refine((ring) => {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}, 'Polygon rings must be closed');

export const createDistrictSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80).optional().default('Lahore'),
  boundary: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(ringSchema).min(1),
  }),
});
