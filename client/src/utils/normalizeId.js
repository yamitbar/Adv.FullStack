// Trip/Location/Memory "createdBy" fields can come back from the API as
// either a raw ObjectId string or a populated object (e.g. { _id, name,
// email }) depending on the endpoint. These helpers make id comparisons
// safe regardless of which shape is present, instead of duplicating the
// same `typeof` checks in every component.

export function getEntityId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
}

export function isSameEntity(a, b) {
  const idA = getEntityId(a);
  const idB = getEntityId(b);

  return Boolean(idA && idB && idA === idB);
}
