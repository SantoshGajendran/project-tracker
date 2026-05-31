package com.projecttracker.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class ImportSessionCache {

    private final ConcurrentHashMap<String, CachedSession> cache = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(runnable -> {
        Thread thread = new Thread(runnable);
        thread.setDaemon(true);
        return thread;
    });

    public ImportSessionCache() {
        scheduler.scheduleAtFixedRate(this::evictExpiredSessions, 1, 1, TimeUnit.MINUTES);
    }

    public void put(String token, List<Object> validRows, String type) {
        cache.put(token, new CachedSession(validRows, type, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(15)));
    }

    public CachedSession get(String token) {
        CachedSession session = cache.get(token);
        if (session != null && session.isExpired()) {
            cache.remove(token);
            return null;
        }
        return session;
    }

    public void remove(String token) {
        cache.remove(token);
    }

    private void evictExpiredSessions() {
        long now = System.currentTimeMillis();
        cache.forEach((token, session) -> {
            if (session.expiryTime < now) {
                cache.remove(token);
            }
        });
    }

    public static class CachedSession {
        private final List<Object> validRows;
        private final String type;
        private final long expiryTime;

        public CachedSession(List<Object> validRows, String type, long expiryTime) {
            this.validRows = validRows;
            this.type = type;
            this.expiryTime = expiryTime;
        }

        public List<Object> getValidRows() {
            return validRows;
        }

        public String getType() {
            return type;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }
}
