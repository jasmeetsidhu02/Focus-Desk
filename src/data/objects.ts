export const SCENE_OBJECT_IDS = {
  LAPTOP: 'laptop',
  MUG: 'mug',
  PLANT: 'plant',
  BOOK: 'book',
  LAMP: 'lamp',
} as const

export type SceneObjectId = (typeof SCENE_OBJECT_IDS)[keyof typeof SCENE_OBJECT_IDS]

export interface SceneObjectData {
  id: SceneObjectId
  label: string
  description: string
  position: [number, number, number]
  geometry: 'box' | 'cylinder' | 'cone'
  args: number[]
  color: string
}

export const sceneObjects: SceneObjectData[] = [
  {
    id: SCENE_OBJECT_IDS.LAPTOP,
    label: 'Laptop',
    description: "What I'm working on right now — click to see current projects.",
    position: [-2, 0, 0],
    geometry: 'box',
    args: [1.2, 0.08, 0.8],
    color: '#3a3a42',
  },
  {
    id: SCENE_OBJECT_IDS.MUG,
    label: 'Coffee Mug',
    description: 'Fuel for late-night debugging sessions.',
    position: [-0.6, 0, 0.6],
    geometry: 'cylinder',
    args: [0.2, 0.2, 0.35, 24],
    color: '#e8b98a',
  },
  {
    id: SCENE_OBJECT_IDS.PLANT,
    label: 'Desk Plant',
    description: 'The one thing on this desk that grows on its own.',
    position: [0.6, 0, 0.6],
    geometry: 'cone',
    args: [0.25, 0.6, 16],
    color: '#5c7a4f',
  },
  {
    id: SCENE_OBJECT_IDS.BOOK,
    label: 'Notebook',
    description: 'Project ideas and TODOs, half of which are still unchecked.',
    position: [1.8, 0, 0.2],
    geometry: 'box',
    args: [0.5, 0.06, 0.7],
    color: '#c94f3d',
  },
  {
    id: SCENE_OBJECT_IDS.LAMP,
    label: 'Desk Lamp',
    description: 'Also the light switch for this scene — click to toggle the lights.',
    position: [2.6, 0, -0.4],
    geometry: 'cylinder',
    args: [0.15, 0.25, 0.9, 16],
    color: '#d8a13a',
  },
]
