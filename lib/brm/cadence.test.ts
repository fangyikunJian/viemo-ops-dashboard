import { describe, expect, it } from "vitest";
import {
  cadenceThresholdDays,
  computeCadence,
  describeLastContact,
  summariseCadence,
  CADENCE_SEVERITY,
  type CadenceResult,
} from "./cadence";

/** Fixed "now" so every case is deterministic. */
const NOW = new Date("2026-08-17T10:00:00.000Z");

/** Build a date N days before NOW. */
function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

describe("cadenceThresholdDays", () => {
  it("warns at a fifth of the cadence window", () => {
    expect(cadenceThresholdDays(30)).toBe(6);
    expect(cadenceThresholdDays(90)).toBe(18);
  });

  it("never warns less than a day out, however short the cadence", () => {
    expect(cadenceThresholdDays(1)).toBe(1);
    expect(cadenceThresholdDays(3)).toBe(1);
  });

  it("caps the warning window at 30 days so annual cadences are not noisy", () => {
    // A fifth of a year is 73 days, which would flag the relationship as
    // needing attention for a fifth of its life. Capped instead.
    expect(cadenceThresholdDays(365)).toBe(30);
  });
});

describe("computeCadence", () => {
  describe("relationships that are not tracked", () => {
    it("returns NOT_TRACKED when no cadence has been agreed", () => {
      const result = computeCadence(
        {
          cadenceDays: null,
          lastContactAt: daysAgo(400),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("NOT_TRACKED");
      expect(result.dueAt).toBeNull();
      expect(result.daysUntilDue).toBeNull();
    });

    it("does not track dormant relationships even when they have a cadence", () => {
      // Dormant is a deliberate resting state. Chasing it would defeat the
      // purpose of having the state at all.
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(400),
          status: "DORMANT",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("NOT_TRACKED");
    });

    it("does not track archived relationships", () => {
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(400),
          status: "ARCHIVED",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("NOT_TRACKED");
    });

    it("still reports how long it has been, so the UI can show history", () => {
      const result = computeCadence(
        {
          cadenceDays: null,
          lastContactAt: daysAgo(42),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("NOT_TRACKED");
      expect(result.daysSinceContact).toBe(42);
    });
  });

  describe("tracked relationships", () => {
    it("is ON_TRACK well inside the window", () => {
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(5),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("ON_TRACK");
      expect(result.daysUntilDue).toBe(25);
      expect(result.daysSinceContact).toBe(5);
    });

    it("is DUE_SOON inside the final fifth of the window", () => {
      // 30-day cadence warns at 6 days out; 25 days elapsed leaves 5.
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(25),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("DUE_SOON");
      expect(result.daysUntilDue).toBe(5);
    });

    it("is DUE_SOON, not OVERDUE, on the day it falls due", () => {
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(30),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("DUE_SOON");
      expect(result.daysUntilDue).toBe(0);
    });

    it("is OVERDUE the day after it falls due", () => {
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(31),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("OVERDUE");
      expect(result.daysUntilDue).toBe(-1);
      expect(result.daysOverdue).toBe(1);
    });

    it("reports how far overdue it has run", () => {
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: daysAgo(100),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("OVERDUE");
      expect(result.daysOverdue).toBe(70);
    });

    it("tracks prospective relationships, which is where cadence matters most", () => {
      const result = computeCadence(
        {
          cadenceDays: 14,
          lastContactAt: daysAgo(20),
          status: "PROSPECTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("OVERDUE");
    });
  });

  describe("relationships never contacted", () => {
    it("counts the clock from when the relationship was added", () => {
      // Adding a relationship starts the obligation to make first contact.
      // Treating "never contacted" as instantly overdue would be wrong; giving
      // it no due date at all would let it disappear.
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: null,
          status: "PROSPECTIVE",
          createdAt: daysAgo(3),
        },
        NOW,
      );

      expect(result.status).toBe("ON_TRACK");
      expect(result.daysUntilDue).toBe(27);
      expect(result.hasEverBeenContacted).toBe(false);
      expect(result.daysSinceContact).toBeNull();
    });

    it("goes overdue once the first cadence window lapses", () => {
      const result = computeCadence(
        {
          cadenceDays: 30,
          lastContactAt: null,
          status: "PROSPECTIVE",
          createdAt: daysAgo(45),
        },
        NOW,
      );

      expect(result.status).toBe("OVERDUE");
      expect(result.daysOverdue).toBe(15);
      expect(result.hasEverBeenContacted).toBe(false);
    });
  });

  describe("bad data", () => {
    it("is safe against a cadence of zero or a negative cadence", () => {
      // Not reachable through the UI, but the function must not divide the
      // application by zero if bad data reaches it.
      const result = computeCadence(
        {
          cadenceDays: 0,
          lastContactAt: daysAgo(5),
          status: "ACTIVE",
          createdAt: daysAgo(500),
        },
        NOW,
      );

      expect(result.status).toBe("NOT_TRACKED");
    });
  });
});

describe("summariseCadence", () => {
  function resultWith(status: CadenceResult["status"]): CadenceResult {
    return {
      status,
      dueAt: null,
      daysUntilDue: null,
      daysOverdue: null,
      daysSinceContact: null,
      hasEverBeenContacted: false,
    };
  }

  it("counts each status and the total", () => {
    const summary = summariseCadence([
      resultWith("OVERDUE"),
      resultWith("OVERDUE"),
      resultWith("DUE_SOON"),
      resultWith("ON_TRACK"),
      resultWith("ON_TRACK"),
      resultWith("NOT_TRACKED"),
    ]);

    expect(summary.OVERDUE).toBe(2);
    expect(summary.DUE_SOON).toBe(1);
    expect(summary.ON_TRACK).toBe(2);
    expect(summary.NOT_TRACKED).toBe(1);
    expect(summary.total).toBe(6);
  });

  it("returns zeroes rather than an empty object for no relationships", () => {
    // The dashboard renders every count unconditionally, so a missing key would
    // put "undefined" on the screen rather than "0".
    const summary = summariseCadence([]);

    expect(summary.total).toBe(0);
    expect(summary.OVERDUE).toBe(0);
    expect(summary.ON_TRACK).toBe(0);
  });
});

describe("CADENCE_SEVERITY", () => {
  it("sorts the statuses needing attention above those that do not", () => {
    expect(CADENCE_SEVERITY.OVERDUE).toBeGreaterThan(CADENCE_SEVERITY.DUE_SOON);
    expect(CADENCE_SEVERITY.DUE_SOON).toBeGreaterThan(CADENCE_SEVERITY.ON_TRACK);
    expect(CADENCE_SEVERITY.ON_TRACK).toBeGreaterThan(
      CADENCE_SEVERITY.NOT_TRACKED,
    );
  });
});

describe("describeLastContact", () => {
  function contacted(daysSince: number | null): CadenceResult {
    return {
      status: "ON_TRACK",
      dueAt: null,
      daysUntilDue: null,
      daysOverdue: null,
      daysSinceContact: daysSince,
      hasEverBeenContacted: daysSince !== null,
    };
  }

  it("says so plainly when there has never been contact", () => {
    expect(describeLastContact(contacted(null))).toBe("Never contacted");
  });

  it("uses days for the first month", () => {
    expect(describeLastContact(contacted(0))).toBe("Contacted today");
    expect(describeLastContact(contacted(1))).toBe("Contacted yesterday");
    expect(describeLastContact(contacted(9))).toBe("Contacted 9 days ago");
    expect(describeLastContact(contacted(29))).toBe("Contacted 29 days ago");
  });

  it("switches to months past thirty days", () => {
    expect(describeLastContact(contacted(30))).toBe(
      "Contacted about a month ago",
    );
    expect(describeLastContact(contacted(95))).toBe(
      "Contacted about 3 months ago",
    );
  });

  it("switches to years past a year", () => {
    expect(describeLastContact(contacted(400))).toBe(
      "Contacted about a year ago",
    );
    expect(describeLastContact(contacted(900))).toBe(
      "Contacted over 2 years ago",
    );
  });
});
