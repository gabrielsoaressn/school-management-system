import { describe, expect, it } from "vitest";
import type { UserRole } from "@prisma/client";
import {
  DEFAULT_ROUTE_BY_ROLE,
  PERMISSIONS,
  can,
  canAny,
  permissionsFor,
  requiredPermissionFor,
} from "./permissions";

const ROLES: UserRole[] = [
  "ADMIN",
  "FINANCE",
  "SECRETARY",
  "COORDINATOR",
  "TEACHER",
  "PARENT",
  "STUDENT",
  "STAFF",
];

describe("can", () => {
  it("gives ADMIN every permission", () => {
    for (const permission of PERMISSIONS) {
      expect(can({ role: "ADMIN" }, permission)).toBe(true);
    }
  });

  it("refuses everything for a missing user", () => {
    expect(can(null, "admin:panel")).toBe(false);
    expect(can(undefined, "billing:read")).toBe(false);
  });

  it("keeps payroll and salary to ADMIN and FINANCE only", () => {
    // The one hard rule the school stated: nobody else sees what people earn.
    const allowed: UserRole[] = ["ADMIN", "FINANCE"];

    for (const role of ROLES) {
      const expected = allowed.includes(role);

      expect(can({ role }, "payroll:read")).toBe(expected);
      expect(can({ role }, "payroll:write")).toBe(expected);
      expect(can({ role }, "employee:salary:read")).toBe(expected);
    }
  });

  it("keeps the audit log to ADMIN only", () => {
    for (const role of ROLES) {
      expect(can({ role }, "audit:read")).toBe(role === "ADMIN");
    }
  });

  it("does not let a teacher into the admin panel", () => {
    expect(can({ role: "TEACHER" }, "admin:panel")).toBe(false);
    expect(can({ role: "TEACHER" }, "teacher:panel")).toBe(true);
  });

  it("does not let staff into any portal", () => {
    expect(can({ role: "STAFF" }, "admin:panel")).toBe(false);
    expect(can({ role: "STAFF" }, "teacher:panel")).toBe(false);
    expect(can({ role: "STAFF" }, "parent:panel")).toBe(false);
    expect(can({ role: "STAFF" }, "student:panel")).toBe(false);
  });

  it("does not let a guardian or student write anything academic", () => {
    for (const role of ["PARENT", "STUDENT"] as UserRole[]) {
      expect(can({ role }, "assessment:write")).toBe(false);
      expect(can({ role }, "attendance:write")).toBe(false);
      expect(can({ role }, "student:write")).toBe(false);
      expect(can({ role }, "billing:write")).toBe(false);
    }
  });

  it("does not let the secretary or coordination change billing", () => {
    for (const role of ["SECRETARY", "COORDINATOR"] as UserRole[]) {
      expect(can({ role }, "billing:write")).toBe(false);
      expect(can({ role }, "billing:approve")).toBe(false);
    }
  });

  it("never grants a permission that is not in the list", () => {
    for (const role of ROLES) {
      for (const permission of permissionsFor(role)) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });
});

describe("canAny", () => {
  it("is true when at least one permission is granted", () => {
    expect(
      canAny({ role: "TEACHER" }, ["payroll:read", "assessment:write"])
    ).toBe(true);
  });

  it("is false when none is", () => {
    expect(canAny({ role: "STUDENT" }, ["payroll:read", "billing:write"])).toBe(
      false
    );
  });
});

describe("requiredPermissionFor", () => {
  it("matches the longest prefix, so payroll is not treated as generic finance", () => {
    expect(requiredPermissionFor("/admin/financial/payroll")).toBe(
      "payroll:read"
    );
    expect(requiredPermissionFor("/admin/financial/payroll/new")).toBe(
      "payroll:read"
    );
    expect(requiredPermissionFor("/admin/financial")).toBe("billing:read");
  });

  it("covers every portal", () => {
    expect(requiredPermissionFor("/admin/dashboard")).toBe("admin:panel");
    expect(requiredPermissionFor("/teacher/dashboard")).toBe("teacher:panel");
    expect(requiredPermissionFor("/parent/dashboard")).toBe("parent:panel");
    expect(requiredPermissionFor("/student/report")).toBe("student:panel");
  });

  it("returns null for a public route", () => {
    expect(requiredPermissionFor("/login")).toBeNull();
    expect(requiredPermissionFor("/matricula")).toBeNull();
    expect(requiredPermissionFor("/privacidade")).toBeNull();
  });

  /**
   * The middleware sends a denied user to their landing page. If that page were
   * itself denied, the redirect would loop.
   */
  it("gives every role a landing page it is allowed to open", () => {
    for (const role of ROLES) {
      const landing = DEFAULT_ROUTE_BY_ROLE[role];
      const permission = requiredPermissionFor(landing);

      if (permission) {
        expect(
          can({ role }, permission),
          `${role} cannot open its own landing page ${landing}`
        ).toBe(true);
      }
    }
  });
});
