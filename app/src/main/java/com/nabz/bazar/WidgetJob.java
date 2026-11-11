package com.nabz.bazar;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;

/** Refreshes the light widget data every 15 minutes (the shortest period Android allows), only when online. */
public class WidgetJob extends JobService {
    static final int ID = 7101;

    static void schedule(Context ctx) {
        try {
            if (StackWidget.allIds(ctx).length == 0) return;
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js == null || js.getPendingJob(ID) != null) return;
            js.schedule(new JobInfo.Builder(ID, new ComponentName(ctx, WidgetJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPeriodic(15 * 60 * 1000L)
                .setPersisted(false)
                .build());
        } catch (Exception ignored) { }
    }

    static void cancel(Context ctx) {
        try { ctx.getSystemService(JobScheduler.class).cancel(ID); } catch (Exception ignored) { }
    }

    @Override
    public boolean onStartJob(final JobParameters p) {
        new Thread(() -> {
            try { WidgetData.fetch(getApplicationContext()); } catch (Exception ignored) { }
            StackWidget.notifyChanged(getApplicationContext());
            jobFinished(p, false);
        }).start();
        return true;
    }

    @Override public boolean onStopJob(JobParameters p) { return true; }
}
