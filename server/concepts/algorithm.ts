import { ObjectId } from "mongodb";
export default class AlgorithmConcept {
  private readonly tagScale = 2;
  private async scoreContent(viewerTags: string[], contentTags: string[], distance: number, date: Date) {
    const timeNow = new Date();
    const diff = Math.abs(timeNow.getTime() - date.getTime());
    const scaledDiff = diff / (1000 * 3600 * 24); // difference in days
    const numCommonTags = viewerTags.filter((tag) => contentTags.includes(tag)).length;

    const distanceScore = (distance / 1000) ** 2;
    const commonTagsScore = (this.tagScale * numCommonTags) ** 2;
    const dateScore = scaledDiff ** 2;
    const score = dateScore + distanceScore - commonTagsScore; // lower score -> more similar
    return score;
  }
  /**
   * @param tagMap maps ObjectId strings to tags
   * @param distanceMap maps ObjectId strings to distances from viewer
   * @param dateMap maps ObjectId strings to associated date
   */
  async sortContent(viewerTags: string[], tagMap: Map<string, string[]>, distanceMap: Map<string, number>, dateMap: Map<string, Date>) {
    const scoreMap: Map<string, number> = new Map();
    for (const [contentId, tags] of tagMap) {
      const distance = distanceMap.get(contentId);
      const date = dateMap.get(contentId);
      const score = await this.scoreContent(viewerTags, tags, distance ? distance : 0, date ? date : new Date());
      scoreMap.set(contentId, score);
    }
    const contentIds = Array.from(scoreMap.keys());
    function compareFunc(a: string, b: string) {
      const aScore = scoreMap.get(a);
      const bScore = scoreMap.get(b);
      if (!aScore) throw new Error("Something went wrong with compare function.");
      if (!bScore) throw new Error("Something went wrong with compare function.");
      return aScore - bScore;
    }
    const sortedContentIds = contentIds.sort(compareFunc);
    return sortedContentIds.map((id) => new ObjectId(id));
  }
}
