/**
 * 데이터베이스 클라이언트 모듈
 * 
 * 이 모듈은 Prisma 클라이언트의 싱글톤 인스턴스를 제공합니다.
 * 전체 애플리케이션에서 일관된 데이터베이스 연결을 보장합니다.
 * 
 * @module shared/api/db
 */

import { PrismaClient } from "@prisma/client";

// 전역 타입 확장
declare global {
  var prisma: PrismaClient | undefined;
}

// 개발 환경에서는 핫 리로딩 시 중복 인스턴스 생성 방지를 위해 globalThis 사용
export const db = globalThis.prisma || new PrismaClient();

// 개발 환경에서만 globalThis에 할당 (프로덕션에서는 필요 없음)
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
} 