/**
 * LRU (Least Recently Used) Cache implementation for memory-efficient caching
 * Automatically evicts least recently used items when size limit is reached
 */

interface LRUCacheNode<T> {
  key: string;
  value: T;
  prev: LRUCacheNode<T> | null;
  next: LRUCacheNode<T> | null;
}

export class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, LRUCacheNode<T>>;
  private head: LRUCacheNode<T> | null;
  private tail: LRUCacheNode<T> | null;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  /**
   * Update cache capacity dynamically
   */
  setCapacity(newCapacity: number): void {
    this.capacity = newCapacity;
    // Evict items if over new capacity
    while (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  /**
   * Get current capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Get value from cache and mark as recently used
   */
  get(key: string): T | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node and move to front
      existingNode.value = value;
      this.moveToFront(existingNode);
      return;
    }

    // Create new node
    const newNode: LRUCacheNode<T> = {
      key,
      value,
      prev: null,
      next: this.head,
    };

    // Add to front
    if (this.head) {
      this.head.prev = newNode;
    }
    this.head = newNode;

    // If this is the first node, set as tail
    if (!this.tail) {
      this.tail = newNode;
    }

    this.cache.set(key, newNode);

    // Evict least recently used if over capacity
    if (this.cache.size > this.capacity) {
      this.evictLRU();
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get current size of cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in cache (for debugging/cleanup)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Remove entries that match a predicate (for cleanup)
   */
  deleteIf(predicate: (key: string, value: T) => boolean): number {
    let deleted = 0;
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (predicate(key, node.value)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (this.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Move node to front (most recently used)
   */
  private moveToFront(node: LRUCacheNode<T>): void {
    // Already at front
    if (node === this.head) {
      return;
    }

    // Remove from current position
    this.removeNode(node);

    // Add to front
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    // Update tail if needed
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Remove node from linked list
   */
  private removeNode(node: LRUCacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // This is the head
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // This is the tail
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
  }

  /**
   * Evict least recently used item (tail)
   */
  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const lruKey = this.tail.key;
    this.removeNode(this.tail);
    this.cache.delete(lruKey);
  }
}

