import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

class SupabaseClient {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in environment variables");
    }

    this.client = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Store resume chunk embeddings
   * @param {Array} chunks - Array of chunks with embeddings
   * @param {string} resumeId - Resume ID from MongoDB
   * @param {string} userId - User ID from MongoDB
   * @returns {Object} - Supabase response
   */
  async storeResumeEmbeddings(chunks, resumeId, userId) {
    // Validate inputs
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("Invalid chunks array provided");
    }

    if (!resumeId || !userId) {
      throw new Error("Resume ID and User ID are required");
    }

    // Validate each chunk has required fields and valid embedding
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (
        !chunk.vector ||
        !Array.isArray(chunk.vector) ||
        chunk.vector.length === 0
      ) {
        throw new Error(
          `Chunk at index ${i} has invalid or missing vector: ${JSON.stringify({
            id: chunk.id,
            type: chunk.type,
            hasVector: !!chunk.vector,
            vectorLength: chunk.vector?.length,
          })}`
        );
      }

      // Check for NaN or undefined values in vector
      if (
        chunk.vector.some(
          (val) => val === null || val === undefined || isNaN(val)
        )
      ) {
        throw new Error(
          `Chunk at index ${i} has invalid vector values (null/undefined/NaN)`
        );
      }
    }

    const embeddings = chunks.map((chunk, index) => {
      const embedding = {
        resume_id: resumeId,
        user_id: userId,
        chunk_id: chunk._id?.$oid || chunk.id || `chunk_${index}`,
        chunk_type: chunk.type || "Unknown",
        chunk_text: chunk.text || "",
        chunk_order: chunk.order || index + 1,
        word_count: chunk.wordCount || 0,
        text_length: chunk.length || chunk.text?.length || 0,
        embedding: chunk.vector,
        is_sub_chunk: chunk.isSubChunk || false,
        parent_chunk_id: chunk.parentId || null,
        created_at: new Date().toISOString(),
      };

      return embedding;
    });

    console.log(
      `Storing ${embeddings.length} resume embeddings for resume: ${resumeId}`
    );
    console.log(
      `Sample embedding dimensions: ${embeddings[0].embedding.length}`
    );

    const { data, error } = await this.client
      .from("resume_embeddings")
      .insert(embeddings);

    if (error) {
      console.error("Supabase error storing resume embeddings:", error);
      throw new Error(`Failed to store resume embeddings: ${error.message}`);
    }

    return { data, count: embeddings.length };
  }

  /**
   * Store job description chunk embeddings
   * @param {Array} chunks - Array of chunks with embeddings
   * @param {string} jdId - Job Description ID from MongoDB
   * @param {string} userId - User ID from MongoDB
   * @returns {Object} - Supabase response
   */
  async storeJdEmbeddings(chunks, jdId, userId) {
    const embeddings = chunks.map((chunk) => {
      let embedding = chunk.vector;

      // Convert to plain array if it's not already
      if (!Array.isArray(embedding)) {
        embedding = Array.from(embedding || []); // handles Float32Array or object
      }

      return {
        jd_id: jdId,
        user_id: userId,
        chunk_id: chunk._id?.$oid || chunk.id,
        chunk_type: chunk.type,
        chunk_text: chunk.text,
        chunk_order: chunk.order,
        word_count: chunk.wordCount,
        text_length: chunk.length,
        embedding, // ✅ now always plain array
        is_sub_chunk: chunk.isSubChunk || false,
        parent_chunk_id: chunk.parentId || null,
        created_at: new Date().toISOString(),
      };
    });

    const { data, error } = await this.client
      .from("jd_embeddings")
      .insert(embeddings);

    if (error) {
      console.error("Error storing JD embeddings:", error);
      throw error;
    }

    return { data, count: embeddings.length };
  }

  /**
   * Get resume embeddings by resume ID
   * @param {string} resumeId - Resume ID
   * @returns {Array} - Array of resume embeddings
   */
  async getResumeEmbeddings(resumeId) {
    const { data, error } = await this.client
      .from("resume_embeddings")
      .select("*")
      .eq("resume_id", resumeId)
      .order("chunk_order");

    if (error) {
      console.error("Error fetching resume embeddings:", error);
      throw error;
    }

    return data;
  }

  /**
   * Get JD embeddings by JD ID
   * @param {string} jdId - Job Description ID
   * @returns {Array} - Array of JD embeddings
   */
  async getJdEmbeddings(jdId) {
    const { data, error } = await this.client
      .from("jd_embeddings")
      .select("*")
      .eq("jd_id", jdId)
      .order("chunk_order");

    if (error) {
      console.error("Error fetching JD embeddings:", error);
      throw error;
    }

    return data;
  }

  /**
   * Delete resume embeddings by resume ID
   * @param {string} resumeId - Resume ID
   * @returns {Object} - Supabase response
   */
  async deleteResumeEmbeddings(resumeId) {
    const { data, error } = await this.client
      .from("resume_embeddings")
      .delete()
      .eq("resume_id", resumeId);

    if (error) {
      console.error("Error deleting resume embeddings:", error);
      throw error;
    }

    return data;
  }

  /**
   * Delete JD embeddings by JD ID
   * @param {string} jdId - Job Description ID
   * @returns {Object} - Supabase response
   */
  async deleteJdEmbeddings(jdId) {
    const { data, error } = await this.client
      .from("jd_embeddings")
      .delete()
      .eq("jd_id", jdId);

    if (error) {
      console.error("Error deleting JD embeddings:", error);
      throw error;
    }

    return data;
  }

  /**
   * Perform semantic search using vector similarity
   * @param {Array} queryVector - Query embedding vector
   * @param {string} tableName - Table name ('resume_embeddings' or 'jd_embeddings')
   * @param {number} limit - Number of results to return
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Array} - Array of similar chunks
   */
  async semanticSearch(queryVector, tableName, limit = 10, threshold = 0.5) {
    const { data, error } = await this.client.rpc("match_chunks", {
      query_embedding: queryVector,
      table_name: tableName,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error("Error performing semantic search:", error);
      throw error;
    }

    return data;
  }
}

export default new SupabaseClient();
