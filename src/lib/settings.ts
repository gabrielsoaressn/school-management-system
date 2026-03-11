import { prisma } from "./prisma";

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key },
  });
  return setting?.value || null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const settings = await prisma.settings.findMany({
    where: {
      key: {
        in: keys,
      },
    },
  });

  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function getSettingAsNumber(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSetting(key);
  return value ? parseFloat(value) : defaultValue;
}

export async function getSettingAsBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSetting(key);
  return value === 'true';
}
