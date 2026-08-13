import { describe, expect, it } from "vitest";
import { nextGradeLevel } from "./re-enrollment";
import { GRADE_LEVELS } from "./constants";

describe("nextGradeLevel", () => {
  it("advances to the following grade", () => {
    expect(nextGradeLevel("1º Ano")).toBe("2º Ano");
    expect(nextGradeLevel("5º Ano")).toBe("6º Ano");
    expect(nextGradeLevel("8º Ano")).toBe("9º Ano");
  });

  it("returns null for the last grade offered", () => {
    expect(nextGradeLevel(GRADE_LEVELS[GRADE_LEVELS.length - 1])).toBeNull();
  });

  it("returns null for a grade the school does not offer", () => {
    expect(nextGradeLevel("1º Ano EM")).toBeNull();
    expect(nextGradeLevel("")).toBeNull();
  });

  it("covers every grade in the list, in order", () => {
    for (let index = 0; index < GRADE_LEVELS.length - 1; index += 1) {
      expect(nextGradeLevel(GRADE_LEVELS[index])).toBe(GRADE_LEVELS[index + 1]);
    }
  });
});
